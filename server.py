# 需安裝函式庫: pip install flask flask-cors pyscard
from flask import Flask, jsonify, request
from flask_cors import CORS
from smartcard.System import readers
from smartcard.util import toHexString
from smartcard.Exceptions import NoCardException, CardConnectionException

app = Flask(__name__)
# 啟用 CORS 讓不同網域的前端（如開發中的 React 或網頁）可以呼叫此 API
CORS(app)

def get_card_data():
    """ 
    封裝讀取 IC 卡的核心邏輯 
    回傳格式: (資料字典, HTTP 狀態碼)
    """
    try:
        available_readers = readers()
        if not available_readers:
            return {"success": False, "error": "系統偵測不到讀卡機，請檢查硬體連接"}, 404

        # 預設使用第一個讀卡機
        reader = available_readers[0]
        connection = reader.createConnection()
        connection.connect()
        
        # 取得 ATR (Answer To Reset) 資訊
        atr = connection.getATR()
        atr_hex = toHexString(atr)
        
        return {
            "success": True, 
            "data": {
                "atr": atr_hex,
                "reader": str(reader),
                "status": "connected"
            }
        }, 200

    except NoCardException:
        return {"success": False, "error": "讀卡機中沒有偵測到卡片"}, 400
    except CardConnectionException:
        return {"success": False, "error": "卡片連線失敗，請嘗試重新插卡"}, 500
    except Exception as e:
        return {"success": False, "error": f"發生未知錯誤: {str(e)}"}, 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """ 檢查 API 伺服器狀態 """
    return jsonify({"status": "online", "message": "IC Card Backend Service is running"}), 200

@app.route('/api/card/read', methods=['GET'])
def read_card():
    """ 
    主要 API 接口：觸發讀卡動作 
    前端僅需發送 GET 請求至此路徑
    """
    response_data, status_code = get_card_data()
    return jsonify(response_data), status_code

if __name__ == '__main__':
    # 伺服器啟動參數設定
    # host='0.0.0.0' 允許同網域的其他裝置（如手機）存取此 API
    print("--------------------------------------")
    print("IC 卡後端服務已啟動")
    print("健康檢查路徑: http://127.0.0.1:5000/api/health")
    print("讀卡 API 路徑: http://127.0.0.1:5000/api/card/read")
    print("--------------------------------------")
    app.run(debug=True, host='0.0.0.0', port=5000)