/**
 * modals.js --- in lieu of foundation reveal
 */
var Modals = {
    init: function () {
        if (!window.jQuery || !window.jQuery.fn.foundation) {
            this.prepareModals();
        }
    },
    prepareModals: function () {
        var modals = Array.from(
            document.querySelectorAll('[data-reveal]')
        );
        modals.forEach(function (modal) {
            modal.style.display = 'none';
            var overlay = document.createElement('div');
            overlay.classList.add('reveal-overlay');
            overlay.setAttribute('data-reveal-overlay', '');
            overlay.style.display = 'none';
            modal.parentNode.appendChild(overlay);
            overlay.appendChild(modal);
        });
        document.addEventListener('click', this.openModalHandler.bind(this));
        document.addEventListener('tap', this.openModalHandler.bind(this));
        document.addEventListener('click', this.closeButtonHandler.bind(this));
        document.addEventListener('tap', this.closeButtonHandler.bind(this));
        document.addEventListener('click', this.clickOverlayHandler.bind(this));
        document.addEventListener('tap', this.clickOverlayHandler.bind(this));
        document.addEventListener('keydown', this.escapeKeyPressHandler.bind(this));
    },
    openModalHandler: function (event) {
        var element = event.target.closest('[data-open]');
        if (!element) { return; }
        var modal = document.getElementById(element.getAttribute('data-open'));
        if (!modal) { return; }
        this.closeAllModals();
        this.openModal(modal);
        event.preventDefault();
    },
    closeButtonHandler: function (event) {
        var element = event.target.closest('[data-close]');
        if (!element) { return; }
        var modal = element.closest('[data-reveal]');
        if (!modal) { return; }
        this.closeModal(modal);
        event.preventDefault();
    },
    clickOverlayHandler: function (event) {
        if (!event.target.matches('[data-reveal-overlay]')) {
            return;
        }
        this.closeAllModals();
        event.preventDefault();
    },
    escapeKeyPressHandler: function (event) {
        if (event.code === 'Escape' || event.key === 'Escape' || event.keyCode === 27 || event.which === 27) {
            this.closeAllModals();
            event.preventDefault();
        }
    },
    openModal: function (modalParam) {
        var modal;
        if (typeof modalParam === "string") {
            modal = document.getElementById(modalParam);
        } else if (modalParam instanceof Element) {
            modal = modalParam;
        } else {
            throw new Error('invalid argument');
        }
        if (!modal) {
            throw new Error('no such modal');
        }
        var overlay = modal.parentNode;
        overlay.style.display = 'block';
        modal.style.display = 'block';
        document.documentElement.classList.add('is-reveal-open');
    },
    closeAllModals: function () {
        Array.from(document.querySelectorAll('[data-reveal]')).forEach(function (modal) {
            this.closeModal(modal);
        }.bind(this));
        document.documentElement.classList.remove('is-reveal-open');
    },
    closeModal: function (modalParam) {
        var modal;
        if (typeof modalParam === "string") {
            modal = document.getElementById(modalParam);
        } else if (modalParam instanceof Element) {
            modal = modalParam;
        } else {
            throw new Error('invalid parameter');
        }
        if (!modal) {
            throw new Error('no such modal');
        }
        var overlay = modal.parentNode;
        overlay.style.display = 'none';
        modal.style.display = 'none';
    },
};
