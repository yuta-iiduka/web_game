#標準ライブラリ
import json


class InfoJSON:
  """
  file_path:読み書きしたいファイルパス
  """
  def __init__(self,file_path):
    self.file_path = file_path
    self.data = None
    self.read()


  def read(self):
    """
    読み込み成功：True
    読み込み失敗：False
    """
    try:
      with open(self.file_path, "r", encoding="utf-8") as file:
        self.data = json.load(file)
        return True
    except Exception as e:
      return False
  

  def write(self):
    """
    書き込み成功：True
    書き込み失敗：False
    """
    try:
      with open(self.file_path, "w", encoding="utf-8") as file:
        json.dump(self.data,file,indent=4,ensure_ascii=False)
      return True
    except Exception as e:
      return False

  def get_data(self):
    return self.data
  
  def set_data(self,key,val):
    self.data[key] = val
    return self.data

if __name__ == "__main__":
  i = InfoJSON("data/object_info.json")  
  print(i.data)