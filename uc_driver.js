'use strict';

const uc = require('uc-integration-api');
const ucDriver = require('./uc_driver_conf');
const ucEntityLight = require('./uc_entity_light');
const ucEntitySwitch = require('./uc_entity_switch');
const ucEntityClimate = require('./uc_entity_climate');
const ucEntityMediaplayer = require('./uc_entity_mediaplayer');
const ucHomeyFlow = require('./uc_homey_flow');

const HOMEY_REFRESH_INTERVAL = 5 * 60000; // x * a Minute.
const HOMEY_SUBSCRIPTION_INTERVAL = 100; //ms

let homeyApi = null;
let flowTrigger = null;
let addAllHomeyDevicesInterval = null;
let eventListeners = [];

async function setHomeyApi(api, ft) {
  homeyApi = api;
  flowTrigger = ft;
  const homeyName = await homeyApi.system.getSystemName();
  const homeyInfo = await homeyApi.system.getInfo();

  let configuration = ucDriver.config;
  configuration.name.en = `Homey (${homeyName})`;
  configuration.driver_id = homeyInfo.cloudId;

  await addAllHomeyDevices();
  addAllHomeyDevicesInterval = setInterval(addAllHomeyDevices, HOMEY_REFRESH_INTERVAL);

  uc.init(configuration);
}
module.exports.setHomeyApi = setHomeyApi;

uc.on(uc.EVENTS.CONNECT, async () => {
  l(`CONNECT`);
  uc.setDeviceState(uc.DEVICE_STATES.CONNECTED);
});

uc.on(uc.EVENTS.DISCONNECT, async () => {
  l(`DISCONNECT`);
  uc.setDeviceState(uc.DEVICE_STATES.DISCONNECTED);
});

uc.on(uc.EVENTS.SETUP_DRIVER, async (wsHandle, setupData) => {
  l(`Setting up driver. Setup data: ${setupData}`);

  await uc.acknowledgeCommand(wsHandle);
  l('Acknowledged driver setup');

  await uc.driverSetupComplete(wsHandle);
  l('Sending Complete');
});

//uc.on(uc.EVENTS.SETUP_DRIVER_USER_CONFIRMATION, async (wsHandle) => {
//  l(`SETUP_DRIVER_USER_CONFIRMATION`);
//});

uc.on(uc.EVENTS.ENTER_STANDBY, async () => {
  l(`ENTER_STANDBY`);
});

uc.on(uc.EVENTS.EXIT_STANDBY, async () => {
  l(`EXIT_STANDBY`);
});

/**
 * Refreshes and adding all Homey devices to UC RemoteTwo
 */
async function addAllHomeyDevices() {
  let homeyDevicesAll = await homeyApi.devices.getDevices();
  await uc.availableEntities.clear();

  // ___ Adding Devices
  for (let i in homeyDevicesAll) {
    const homeyDevice = homeyDevicesAll[i];
    if (typeof homeyDevice !== 'undefined' && typeof homeyDevice.class !== 'undefined') {
      if (homeyDevice.class == 'light') await ucEntityLight.exposeHomeyDevice(uc, homeyDevice);
      if (homeyDevice.class == 'socket') await ucEntitySwitch.exposeHomeyDevice(uc, homeyDevice);
      if (homeyDevice.class == 'fan') await ucEntityClimate.exposeHomeyDevice(uc, homeyDevice);
      if (homeyDevice.class == 'thermostat') await ucEntityClimate.exposeHomeyDevice(uc, homeyDevice);
      if (homeyDevice.class == 'speaker') await ucEntityMediaplayer.exposeHomeyDevice(uc, homeyDevice);
    }
  }

  // ___ Adding Flows
  ucHomeyFlow.add(uc, homeyApi);
}

/**
 * Subscribe to events
 *
 * @type {{ucEntityIds: string}}
 */
uc.on(uc.EVENTS.SUBSCRIBE_ENTITIES, async (ucEntityIds) => {
  for (const ucEntityId of ucEntityIds) {
    let [homeyType, homeyEntityId] = ucEntityId.split('|');
    l(`Received event subscription request for: ${homeyType}, ${homeyEntityId}`);

    if (homeyType === 'flow') {
      // Handle flows differently, to be desided. but are not devices and therefore neef to be handled differently.
      l(`IGNORING SUBSCRIPTION: ${homeyType} in HOMEY ${homeyEntityId} is a Flow trigger.`);
    } else {
      // Expect a Homey Device.
      let homeyDevice = await homeyApi.devices.getDevice({ id: homeyEntityId });

      if (!eventListeners.includes(ucEntityId)) {
        l(`SUBSCRIBING: ${homeyType} in HOMEY ${homeyEntityId}.`);
        if (homeyType === 'light') await ucEntityLight.subscribeHomeyDevice(uc, homeyDevice, ucEntityId);
        if (homeyType === 'socket') await ucEntitySwitch.subscribeHomeyDevice(uc, homeyDevice, ucEntityId);
        if (homeyType === 'climate') await ucEntityClimate.subscribeHomeyDevice(uc, homeyDevice, ucEntityId);
        if (homeyType === 'mediaplayer') await ucEntityMediaplayer.subscribeHomeyDevice(uc, homeyDevice, ucEntityId);
        eventListeners.push(ucEntityId);
        await new Promise((r) => setTimeout(r, HOMEY_SUBSCRIPTION_INTERVAL));
      } else {
        l(`IGNORING SUBSCRIPTION: ${homeyEntityId} is allready subscribed.`);
      }

      // Slow down the event subscription.
    }
  }
});

//uc.on(uc.EVENTS.UNSUBSCRIBE_ENTITIES, async (ucEntityIds) => {
//  l(`UNSUBSCRIBE_ENTITIES ${ucEntityIds}`);
//});

/**
 * Received a command from Remote Two.
 */
uc.on(uc.EVENTS.ENTITY_COMMAND, async (wsHandle, ucEntityId, ucEntityType, cmdId, params) => {
  let [homeyType, homeyEntityId] = ucEntityId.split('|');
  if (homeyType == 'flow') {
    await flowTrigger.trigger({}, { name: homeyEntityId });
    uc.acknowledgeCommand(wsHandle);
  } else {
    let homeyDevice = await homeyApi.devices.getDevice({ id: homeyEntityId });
    if (homeyType == 'light') ucEntityLight.commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params);
    if (homeyType == 'socket') ucEntitySwitch.commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params);
    if (homeyType == 'climate') ucEntityClimate.commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params);
    if (homeyType == 'mediaplayer') ucEntityMediaplayer.commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params);
  }
});

function l(log) {
  console.log(`[UC Homey app] ${log}`);
}
