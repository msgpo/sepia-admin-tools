//------ INTERFACE: ------

var smartHomeSystem = "";
var smartHomeServer = "";

var SEPIA_TAG_NAME = "sepia-name";
var SEPIA_TAG_TYPE = "sepia-type";
var SEPIA_TAG_ROOM = "sepia-room";
var SEPIA_TAG_DATA = "sepia-data";
var SEPIA_TAG_MEM_STATE = "sepia-mem-state";

function smartHomeOnStart(){
	smartHomeSystem = sessionStorage.getItem('smartHomeSystem');
	if (smartHomeSystem){
		if (hasSelectedKnownSmartHomeSystem(smartHomeSystem)){
			$('#smarthome_system_select').val(smartHomeSystem);
		}else{
			$('#smarthome_system_select').val('custom');
			$('#smarthome_system_custom_select').val(smartHomeSystem);
			$('#smarthome_system_custom').show();
		}
	}
	smartHomeServer = sessionStorage.getItem('smartHomeServer');
	if (smartHomeServer){
		$('#smarthome-server').val(smartHomeServer);
	}else{
		var serverViaUrl = getURLParameter('smarthome-server');
		if (serverViaUrl){
			$('#smarthome-server').val(serverViaUrl);
		}
	}
	//change listener
	$('#smarthome_system_select').on('change', function(){
		$('#smarthome-server-indicator').removeClass('secure');
		$('#smarthome-server-indicator').removeClass('inactive');
		if (this.value == "custom"){
			$('#smarthome_system_custom').show();
		}else{
			$('#smarthome_system_custom').hide();
		}
	});
}

function hasSelectedKnownSmartHomeSystem(sys){
	var isOption = false;
	$('#smarthome_system_select option').each(function(){
		if (this.value == sys) {
			isOption = true;
			return false;
		}
	});
	return isOption;
}

function getSmartHomeSystem(){
	var system = $('#smarthome_system_select').val();
	if (system == "custom"){
		$('#smarthome_system_custom').show();
		system = $('#smarthome_system_custom_select').val();
	}
	if (system){
		sessionStorage.setItem('smartHomeSystem', system);
		smartHomeSystem = system;
	}else{
		sessionStorage.setItem('smartHomeSystem', "");
	}
	return system;
}
function getSmartHomeServer(successCallback, errorCallback){
	var host = $('#smarthome-server').val();
	if (host){
		sessionStorage.setItem('smartHomeServer', host);
		smartHomeServer = host;
		if (successCallback) successCallback(host);
	}else{
		sessionStorage.setItem('smartHomeServer', "");
		smartHomeServer = "";
		if (errorCallback) errorCallback();
	}
	return host;
}
function getSmartHomeHubDataFromServer(){
	var body = {};
	genericPostRequest("assist", "integrations/smart-home/getConfiguration", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			$('#smarthome_system_select').val(data.hubName);
			$('#smarthome-server').val(data.hubHost);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
		}
	);
}

function getSmartHomeDevices(successCallback, errorCallback){
	$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost
	};
	genericPostRequest("assist", "integrations/smart-home/getDevices", body,
		function (data){
			//showMessage(JSON.stringify(data, null, 2));
			console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			var devices = data.devices;
			if (devices && devices.length > 0){
				//build DOM objects
				devices.forEach(function(item){
					var domObj = buildSmartHomeItem(item);
					if (domObj){
						$('#smarthome-devices-list').append(domObj);
					}
				});
				//add button listeners
				$('.shi-property').off().on('change', function(){
					var $item = $(this).closest('.smarthome-item');
					var property = $(this).attr('data-shi-property');
					//console.log(property);
					var newVal = $(this).val();
					var shiString = $item.attr('data-shi');
					if (shiString){
						var shi = JSON.parse(shiString);
						putSmartHomeItemProperty(shi, property, newVal, function(){
							console.log("Smart home item: " + shi.name + ", changed '" + property + "' to: " + newVal);
							$item.attr('data-shi', JSON.stringify(shi));
						}, function(){
							var msg = "Smart home item: " + shi.name + ", FAILED to change '" + property + "' to: " + newVal;
							console.log(msg);
							alert(msg);
						});
					}
				});
			}else{
				alert("No devices found.");
			}
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
			alert("No items found or no access to smart home system.");
		}
	);
}

function registerSepiaInsideSmartHomeHub(){
	$('#smarthome-devices-list').html("");
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var body = {
		hubName: hubName,
		hubHost: hubHost
	};
	genericPostRequest("assist", "integrations/smart-home/registerFramework", body,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
		}
	);
}

function putSmartHomeItemProperty(shi, property, value, successCallback, errorCallback){
	var hubHost = getSmartHomeServer();
	var hubName = getSmartHomeSystem();
	if (!hubHost || !hubName){
		showMessage('Error: missing HUB server or host address');
		return;
	}
	var attribs = {};
	attribs[property] = value;
	var body = {
		hubName: hubName,
		hubHost: hubHost,
		device: shi,
		attributes: attribs
	};
	genericPostRequest("assist", "integrations/smart-home/setDeviceAttributes", body,
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			//console.log(data);
			$('#smarthome-server-indicator').removeClass('inactive');
			$('#smarthome-server-indicator').addClass('secure');
			if (successCallback) successCallback();
		},
		function (data){
			showMessage(JSON.stringify(data, null, 2));
			$('#smarthome-server-indicator').removeClass('secure');
			$('#smarthome-server-indicator').removeClass('inactive');
			if (errorCallback) errorCallback();
		}
	);
}
function deleteSmartHomeItemProperty(shi, property, successCallback, errorCallback){
	//TODO: for now we just set value to empty
	putSmartHomeItemProperty(shi, property, "", successCallback, errorCallback);
}

//------ DOM ------

function buildSmartHomeItem(shi){
	var shiObj = "<div class='smarthome-item' data-shi='" + JSON.stringify(shi) + "'>" +
		"<div class='smarthome-item-title'>" + shi.name.replace("<", "&lt;").replace(">", "&gt;") + "</div>" +
		"<div class='smarthome-item-body'>" + 
			"<div><label>State:</label>" + "<span class='shi-info smarthome-item-state'>" + shi.state + "</span></div>" + 
			"<div><label>Type:</label>" + "<select class='shi-property smarthome-item-type' data-shi-property='" + SEPIA_TAG_TYPE + "'>" +
					buildSmartHomeTypeOptions(shi.type) +
			"</select></div>" + 
			"<div><label>Room:</label>" + "<select class='shi-property smarthome-item-room' data-shi-property='" + SEPIA_TAG_ROOM + "'>" +
					buildSmartHomeRoomOptions(shi.room) +
			"</select></div>" + 
		"</div>" +
	"</div>";
	return shiObj;
}
function buildSmartHomeTypeOptions(selected){
	var options = {
		"light" : "Light",
		"heater" : "Heater",
		"device" : "Device"
		/* ---tbd---
		"tv" : "TV",
		"music_player" : "Music Player",
		"fridge" : "Fridge",
		"oven" : " "Oven",
		"coffee_maker" : "Coffee Maker",
		*/
	}
	var optionsObj = "";
	foundSelected = false;
	for (o in options){
		var oName = options[o];
		if (o == selected){
			optionsObj += "<option value='" + o + "' selected>" + oName + "</option>";
			foundSelected = true;
		}else{
			optionsObj += "<option value='" + o + "'>" + oName + "</option>";
		}
	}
	if (foundSelected){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}else{
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	}
}
function buildSmartHomeRoomOptions(selected){
	var options = {
		"livingroom" : "Living room",
		"diningroom" : "Dining room",
		"kitchen" : "Kitchen",
		"bedroom" : "Bedroom",
		"bath" : "Bath",
		"office" : "Office",
		"study" : "Study room",
		"garage" : "Garage",
		"shack" : "Shack"
	}
	var optionsObj = "";
	var foundSelected = false;
	for (o in options){
		var oName = options[o];
		if (o == selected){
			optionsObj += "<option value='" + o + "' selected>" + oName + "</option>";
			foundSelected = true;
		}else{
			optionsObj += "<option value='" + o + "'>" + oName + "</option>";
		}
	}
	if (foundSelected){
		return ("<option value='' disabled>- Choose -</option>" + optionsObj);
	}else{
		return ("<option value='' disabled selected>- Choose -</option>" + optionsObj);
	}
}
