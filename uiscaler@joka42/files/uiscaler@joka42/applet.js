// UI Scaling applet by joka42 
// based on Resolution Switcher applet by dennis@nixdev.com
const Applet = imports.ui.applet;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

function ConfirmDialog() {
    this._init();
}

function MyApplet(orientation) {
    this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,


    _init: function (orientation) {
        Applet.IconApplet.prototype._init.call(this, orientation);

        this.set_applet_icon_symbolic_name("video-display-symbolic");
        this.set_applet_tooltip("Scale user interface with one click");
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this._contentSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._contentSection);
        //HiDPI 200% Scaling
        this.menu.addAction("Scale 200%", function (event) {
            Main.Util.spawnCommandLine(`${__meta.path}/uiscaler 200`);
        });
        //HiDPI 175% Scale
        this.menu.addAction("Scale 175%", function (event) {
            Main.Util.spawnCommandLine(`${__meta.path}/uiscaler 175`);
        });
        //HiDPI 150% Scale
        this.menu.addAction("Scale 150%", function (event) {
            Main.Util.spawnCommandLine(`${__meta.path}/uiscaler 150`);
        });
        //HiDPI 125% Scale
        this.menu.addAction("Scale 125%", function (event) {
            Main.Util.spawnCommandLine(`${__meta.path}/uiscaler 125`);
        });
        //Reset 100% 
        this.menu.addAction("Reset 100%", function (event) {
            Main.Util.spawnCommandLine(`${__meta.path}/uiscaler 100`);
        });

        this.load_json();
    },

    load_json: function () {
        this.set_applet_tooltip("Hello");
        // let jsonData = require("/home/jonas/.cinnamon/configs/menu@cinnamon.org/63.json");
        //let jsonData = require(`${__meta.path}/metadata.json`);
        // this.set_applet_tooltip(jsonData);
        const path = `${__meta.path}/metadata.json`;
        let data;
        fs.readFile(require.resolve(path), (err, data))
        data = JSON.parse(data)
        this.set_applet_tooltip(data)
    },

    on_applet_clicked: function (event) {
        this.menu.toggle();
    },

};

function main(metadata, orientation) {
    let myApplet = new MyApplet(orientation);
    return myApplet;
}
