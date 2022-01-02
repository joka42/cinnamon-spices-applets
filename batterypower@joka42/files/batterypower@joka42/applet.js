const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Applet = imports.ui.applet;
const Settings = imports.ui.settings;

const UUID = "batterypower@joka42";

function BatteryPowerApplet(metadata, orientation, instance_id) {
	this._init(metadata, orientation, instance_id);
}

BatteryPowerApplet.prototype = {
	__proto__: Applet.TextApplet.prototype,

	_init: function (metadata, orientation, instance_id) {
		Applet.TextApplet.prototype._init.call(this, orientation, instance_id);

		if (orientation == St.Side.LEFT || orientation == St.Side.RIGHT) {
			this.isHorizontal = false;
		} else {
			this.isHorizontal = true;
		}
		this.state = {};
		this.settings = new Settings.AppletSettings(this.state, metadata.uuid, instance_id);
		this.settings.bindProperty(Settings.BindingDirection.IN, 'show-unit', 'showunit', () => this.on_settings_changed(), null);
    	this.settings.bindProperty(Settings.BindingDirection.IN, 'interval', 'interval', () => this.on_settings_changed(), null);

		this.update()
		this.loopId = Mainloop.timeout_add(this.state.interval, () => this.update());
	},

	update: function() {
		const power = this._getBatteryPower();
		if (isNaN(power)){
			this.set_applet_label("ERROR");
			this.set_applet_tooltip("ERROR: Your system is not supported, yet.\nConsider reporting an issue on github: https://github.com/linuxmint/cinnamon-spices-applets");
			return false;
		}

		const value = ((Math.round(power * 10) / 10)
			.toFixed(1)
			.toString()
		);
		const separator = (this.isHorizontal) ? " " : "\n";
		const unit_string = (this.state.showunit) ? separator + "W" : "";
		const charging_indicator = "⚡";
		
		const status = this._getBatteryStatus();
			
		switch (status){
			case "Charging":
				this.set_applet_tooltip('Battery is charging. Battery charging power is displayed.\nThis is not the power consumption of the system!');
				this.set_applet_label(charging_indicator + separator + value + unit_string);
				break;
			case "Discharging":
				this.set_applet_tooltip('Battery is discharging. Power drawn from battery is displayed.');
				this.set_applet_label(value + unit_string);
				break;
			case "Unknown":
				this.set_applet_tooltip('Battery is fully charged. AC is plugged in.');
				this.set_applet_label(charging_indicator);
				break;
			default:
				this.set_applet_tooltip('Status unknown, please contact the maintainer https://github.com/linuxmint/cinnamon-spices-applets/issues');
				this.set_applet_label(charging_indicator);
		}
		return true;
	},

	// use upower as source for battery information:
	//  - checkout the cinnamon power applet, it uses upower
	//    /home/jonas/Projects/cinnamon/files/usr/share/cinnamon/applets/power@cinnamon.org
	//  - upower update rate is low, approx 90 sec, a fix is here: 
	//    https://askubuntu.com/questions/878556/get-battery-status-to-update-more-often-or-on-ac-power-wake
	//  - is upower already installed on all systems, or is a dependency necessary?
	//    > probably installed, since all battery applets are using it.

	_getBatteryStatus: function () {
		const statusFile = "/sys/class/power_supply/BAT0/status";
		if (!GLib.file_test(statusFile, 1 << 4)) {
			return null;
		}
		
		return String(GLib.file_get_contents(statusFile)[1]).trim();
	},

	_getBatteryPower: function () {
		// Depending on the files that are present in /sys/class/power_supply/BAT0/ the power that is drawn from the
		// battery, or that is used to charge the battery is returned.
		// NaN, if no file is found.
		const powerDrawFile = "/sys/class/power_supply/BAT0/power_now";
		if(GLib.file_test(powerDrawFile, 1 << 4)) {
			return parseInt(GLib.file_get_contents(powerDrawFile)[1]) / 1000000.0;
		}
		
		const currentDrawFile = "/sys/class/power_supply/BAT0/current_now";
		const voltageDrawFile = "/sys/class/power_supply/BAT0/voltage_now";
		if (GLib.file_test(currentDrawFile, 1 << 4) && GLib.file_test(voltageDrawFile, 1 << 4)) {
			const current = parseInt(GLib.file_get_contents(currentDrawFile)[1]) / 1000000.0;
			const voltage = parseInt(GLib.file_get_contents(voltageDrawFile)[1]) / 1000000.0;
			
			return current * voltage;
		}

		Main.Util.spawnCommandLine(`python3 ${__meta.path}/update_upower.py`);
		const upowerEnergyRateFile = ".energyrate"
		if(GLib.file_test(upowerEnergyRateFile, 1 << 4)) {
			return parseFloat(String(GLib.file_get_contents(upowerEnergyRateFile)[1]).replace(",","."));
		}
		
		return NaN
	},

	on_settings_changed: function() {
		if (this.loopId > 0) {
			Mainloop.source_remove(this.loopId);
		}
		this.loopId = 0;
		this.loopId = Mainloop.timeout_add(this.state.interval, () => this.mainloop());
	},
};

function main(metadata, orientation, instance_id) {
	return new BatteryPowerApplet(metadata, orientation, instance_id);
}
