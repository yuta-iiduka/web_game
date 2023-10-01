class NoticeLoad {
  constructor(url) {
    this.xhr = new XMLHttpRequest();
    this.url = url;
    this.init();
  }

  init() {
    let self = this;
    this.xhr.onload = function () {
      let READYSTATE_COMPLETED = 4;
      let HTTP_STATUS_OK = 200;
      if (this.readyState == READYSTATE_COMPLETED && this.status == HTTP_STATUS_OK) {
        let res = JSON.parse(this.response);
        for (let i = 0; i < res.length; i++) {
          let notice = res[i];
          // <div style="font-size:x-small;">${notice.start_datetime}~${notice.end_datetime}</div>
          notice_modal.appendBody(`
            <h3>
              <div id="notice-title"><i class="bi bi-info-circle"></i>${notice.title}</div>
              <pre id="notice-content">${notice.content}</pre>
            </h3>
          `);
        }
        if (res.length > 0) {
          $("#notice").find("#welcom").prepend(`<i class="bi bi-info-circle"></i>`);
          $("#notice").click();
        }
      }
    }
  }

  load() {
    let data = [];
    this.xhr.open("POST", this.url);
    this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.send(JSON.stringify(data));
  }
}
let notice_modal = new Modal("base-content");
notice_modal
  .setHeader("<h2>お知らせ</h2>")
  .setBody()
  .setTrigger("notice")
let notice_load = new NoticeLoad("/notice/load");
notice_load.load();