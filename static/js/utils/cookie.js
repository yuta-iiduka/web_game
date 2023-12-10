class CookieController {

  constructor() {
    //現在のクッキーデータ
    this.data = document.cookie;
  }

  get_cookie(key) {
    if (key === undefined || this.data === "") { return this.data; }
    try {
      return this.data
        .split(";")
        .find((row) => row.trim().startsWith(key))
        .split("=")[1];
    } catch (e) {
      return null;
    }

  }

  set_cookie(key, val) {
    try {
      const sepa = ";";
      const equal = "=";
      let cookie = this.get_cookie();
      let cookie_list = cookie.split(sepa);
      let new_cookie = key + equal + val + sepa;
      if (cookie_list.length > 0 && cookie_list[0] !== "") {
        let cookie_tmp_list = [];
        let exist_key_flag = false;
        for (let i = 0; i < cookie_list.length; i++) {
          let c_tmp = cookie_list[i].split(equal);
          let c_key = c_tmp[0];
          if (c_key === key) {
            cookie_tmp_list.push(c_key + equal + val);
            exist_key_flag = true;
          } else {
            cookie_tmp_list.push(cookie_list[i]);
          }
        }

        if (exist_key_flag === false) {
          new_cookie = new_cookie + cookie_tmp_list.join(sepa);
        } else {
          new_cookie = cookie_tmp_list.join(sepa);
        }
      }
      this.data = new_cookie;
      document.cookie = new_cookie;
      //クッキーを書き込めた場合
      return true;
    } catch (e) {
      //クッキーを各込めなかった場合
      console.error(e);
      return false;
    }
  }

  reset_cookie() {
    document.cookie = "";
    this.data = "";
    return document.cookie;
  }

}

cc = new CookieController();