class LoadJSON {
  constructor(url) {
    this.xhr = new XMLHttpRequest();
    this.url = url;
    this.res_data = null;
    this.req_data = [];
    this.init();
  }

  init() {
    let self = this;
    this.xhr.onload = function () {
      let READYSTATE_COMPLETED = 4;
      let HTTP_STATUS_OK = 200;
      if (this.readyState == READYSTATE_COMPLETED && this.status == HTTP_STATUS_OK) {
        self.res_data = JSON.parse(this.response);
        self.control_res_data();
      }
    }
  }

  // レスポンスデータを利用するオーバーライド用関数
  // JSON構造に合わせて変更を加えてるべき関数
  control_res_data() {
    console.warn(this.res_data);
  }

  post() {
    this.xhr.open("POST", this.url);
    this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.send(JSON.stringify(this.req_data));
  }

  get() {
    this.xhr.open("GET", this.url);
    this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.send(JSON.stringify(this.req_data));
  }

}

class LoadNotice extends LoadJSON {
  constructor(url) {
    super(url);
    this.notice_modal = new Modal("base-content");
    this.notice_modal
      .setHeader("<h2>お知らせ</h2>")
      .setBody()
      .setTrigger("notice")
  }

  control_res_data() {
    for (let i = 0; i < this.res_data.length; i++) {
      let notice = this.res_data[i];
      // <div style="font-size:x-small;">${notice.start_datetime}~${notice.end_datetime}</div>
      this.notice_modal.appendBody(`
        <h3>
          <div id="notice-title"><i class="bi bi-info-circle"></i>${notice.title}</div>
          <pre id="notice-content">${notice.content}</pre>
        </h3>
      `);
    }
    if (this.res_data.length > 0) {
      this.notice_modal.appendBody(`
        <div>
          <input id="show_notice_flag" type="checkbox"/>
          <label for="show_notice_flag">次回から表示しない。</label>
        </div>
      `);

      $("#show_notice_flag").click(function () {
        const show_notice_flag_val = $("#show_notice_flag").prop("checked");
        if (show_notice_flag_val === false) {
          //クッキーにお知らせ非表示フラグを追加
          //CookieController
          cc.set_cookie("show_notice_flag", "true");
        } else {
          //クッキーのお知らせ非表示フラグを削除
          cc.set_cookie("show_notice_flag", "false");
        }
      });
      $("#notice").find("#welcome").prepend(`<i class="bi bi-info-circle"></i>`);
      const show_notice_flag = cc.get_cookie("show_notice_flag");
      if (show_notice_flag === null || show_notice_flag === "true") {
        $("#notice").click();
      } else {
        $("#show_notice_flag").prop("checked", true);
      }
    }
  }
}

let notice_load = new LoadNotice("/notice/load");
notice_load.post();

// let json_load = new LoadJSON("/json/object_info");
// json_load.post();
// json_load.get();