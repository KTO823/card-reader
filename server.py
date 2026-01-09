# 需安裝函式庫: pip install flask flask-cors pyscard
from flask import Flask, jsonify
from flask_cors import CORS
from smartcard.System import readers
from smartcard.util import toHexString
from smartcard.Exceptions import NoCardException, CardConnectionException
import sys

app = Flask(__name__)
# 允許所有來源，這對於從 GitHub Pages 存取本地 API 至關重要
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_card_data():
    try:
        available_readers = readers()
        print(f"[系統訊息] 當前偵測到的讀卡機列表: {available_readers}")
        
        if not available_readers:
            return {"success": False, "error": "硬體錯誤：找不到讀卡機。請檢查 USB 是否插好，或驅動程式是否安裝。"}, 404

        reader = available_readers[0]
        print(f"[系統訊息] 正在嘗試連線至: {reader}")
        
        connection = reader.createConnection()
        connection.connect()
        
        atr = connection.getATR()
        atr_hex = toHexString(atr)
        print(f"[成功] 讀取到卡片 ATR: {atr_hex}")
        
        return {
            "success": True, 
            "data": {
                "atr": atr_hex,
                "reader": str(reader),
                "status": "connected"
            }
        }, 200

    except NoCardException:
        print("[警告] 讀卡機內沒有卡片")
        return {"success": False, "error": "讀卡機中沒有偵測到卡片，請確認卡片已插到底。"}, 400
    except CardConnectionException as e:
        print(f"[錯誤] 卡片連線失敗: {e}")
        return {"success": False, "error": "卡片連線失敗，可能是卡片晶片接觸不良，請重新插入。"}, 500
    except Exception as e:
        print(f"[異常] 未知錯誤: {str(e)}")
        return {"success": False, "error": f"發生系統異常: {str(e)}"}, 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"}), 200

@app.route('/api/card/read', methods=['GET'])
def read_card():
    response_data, status_code = get_card_data()
    return jsonify(response_data), status_code

if __name__ == '__main__':
    print("="*40)
    print("IC 卡後端驅動已啟動")
    print("請確認讀卡機已插上 USB 槽")
    print("伺服器運行於: http://127.0.0.1:5000")
    print("="*40)
    # 關閉 debug 模式有助於某些環境下的穩定性
    app.run(debug=False, host='127.0.0.1', port=5000)
