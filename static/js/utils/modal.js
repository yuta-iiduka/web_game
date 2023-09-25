// JQuery + Bootstrap5依存
class Modal {
	static modal_number = 0;
	constructor(id) {
		this.num = Modal.modal_number
		$('#' + id).append('<div class="modal fade" id="modal' + this.num + '" tabindex="-1" role="dialog" aria-labelledby="modal' + this.num + '" aria-hidden="true" ></div>');
		$('#modal' + this.num).append('<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" id="modal-dialog' + this.num + '"></div>');
		$('#modal-dialog' + this.num).append('<div class="modal-content" id="modal-content' + this.num + '"></div>');
		$('#modal-content' + this.num).append('<div class="modal-header" id="modal-header' + this.num + '"></div>', '<div class="modal-body" id="modal-body' + this.num + '"></div>', '<div class="modal-footer" id="modal-footer' + this.num + '"></div>');
		this.trigger = []
		Modal.modal_number++;
	}
	setButton(buttonId, val) {
		if (val === undefined) { val = "表示"; }
		const btn = $('#' + buttonId);
		const num = Modal.modal_number;
		btn.append('<button type="button" class="btn btn-primary mb-8" data-bs-toggle="modal" data-bs-target="#modal' + this.num + '">' + val + '</button>')
		return this;
	}
	setHeader(html) {
		if (!(html === undefined)) {
			$('#modal-header' + this.num).html(html);
		}
		$('#modal-header' + this.num).append('<button type="button" class="btn btn-secondary" id="modal-close-button' + this.num + '" data-bs-dismiss="modal">×</button>');
		return this;
	}
	setBody(html) {
		if (!(html === undefined)) {
			$('#modal-body' + this.num).html(html);
		}
		return this;
	}
	appendBody(html) {
		if (!(html === undefined)) {
			$('#modal-body' + this.num).append(html);
		}
		return this;
	}
	setFooter(html) {
		if (!(html === undefined)) {
			$('#modal-footer' + this.num).html(html)
		}
		$('#modal-footer' + this.num).append('<button type="button" class="btn btn-secondary" id="modal-no-button' + this.num + '"  data-bs-dismiss="modal">No </button>');
		$('#modal-footer' + this.num).append('<button type="button" class="btn btn-secondary" id="modal-yes-button' + this.num + '" data-bs-dismiss="modal">Yes</button>');
		return this;
	}
	setTrigger(id) {
		$("#" + id).attr({ "data-bs-toggle": 'modal', "data-bs-target": '#modal' + this.num });
		this.trigger.push($("#" + id));
		return this;
	}
	setTriggers(class_name) {
		let target = $("." + class_name);
		for (let i = 0; i < target.length; i++) {
			target.eq(i).attr({ "data-bs-toggle": 'modal', "data-bs-target": '#modal' + this.num });
			this.trigger.push(target.eq(i));
		}
		return this;
	}
	getYesButton() {
		return $('#modal-yes-button' + this.num);
	}
	getNoButton() {
		return $('#modal-no-button' + this.num);
	}
	setTriggerEvent(func) {
		for (var i = 0; i < this.trigger.length; i++) {
			this.trigger[i].click(func);
		}
		return this;
	}
	setYesEvent(func) {
		var btn = $('#modal-yes-button' + this.num);
		btn.click(func);
		return this;
	}
	setNoEvent(func) {
		var btn = $('#modal-no-button' + this.num);
		btn.click(func);
		return this;
	}
}