'use strict';

const SCALE_HUE = 360;
const SCALE_DEFAULT = 255;

let eventListeners = [];

async function exposeHomeyDevice(uc, homeyDevice) {
  const deviceName = new Map([['en', `${homeyDevice.zoneName}, ${homeyDevice.name}`]]);
  const deviceFeatures = await ucFeaturesFromHomeyDevice(uc, homeyDevice);
  const deviceStates = await ucStatesFromHomeyDevice(uc, homeyDevice);
  const ucEntityId = `light|${homeyDevice.id}`;
  const deviceClass = undefined;
  const deviceOptions = null;
  const deviceArea = homeyDevice.zoneName;
  const ucEntity = new uc.Entities.Light(ucEntityId, deviceName, deviceFeatures, deviceStates, deviceClass, deviceOptions, deviceArea);
  uc.availableEntities.addEntity(ucEntity);
}

async function subscribeHomeyDevice(uc, homeyDevice, ucEntityId) {
  if (!eventListeners.includes(ucEntityId)) {
    if (homeyDevice.capabilities.includes('onoff')) {
      homeyDevice.makeCapabilityInstance('onoff', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.STATE], value ? uc.Entities.Light.STATES.ON : uc.Entities.Light.STATES.OFF);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }

    if (homeyDevice.capabilities.includes('dim')) {
      homeyDevice.makeCapabilityInstance('dim', (value) => {
        value = parseInt(value * SCALE_DEFAULT);
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.BRIGHTNESS], value);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }

    if (homeyDevice.capabilities.includes('light_hue')) {
      homeyDevice.makeCapabilityInstance('light_hue', (value) => {
        value = parseInt(value * SCALE_HUE);
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.HUE], value);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }

    if (homeyDevice.capabilities.includes('light_saturation')) {
      homeyDevice.makeCapabilityInstance('light_saturation', (value) => {
        value = parseInt(value * SCALE_DEFAULT);
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.SATURATION], value);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }

    if (homeyDevice.capabilities.includes('light_temperature')) {
      homeyDevice.makeCapabilityInstance('light_temperature', (value) => {
        value = parseInt(value * SCALE_DEFAULT);
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.COLOR_TEMPERATURE], value);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
  }
  eventListeners.push(ucEntityId);
}

async function commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params) {
  if (cmdId == 'on') {
    await homeyDevice
      .setCapabilityValue('onoff', true)
      .then((r) => {})
      .catch((e) => {
        uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.SERVER_ERROR);
      });
    if (typeof params !== 'undefined' && typeof params.hue !== 'undefined' && typeof params.saturation !== 'undefined') {
      await homeyDevice.setCapabilityValue('light_hue', params.hue / SCALE_HUE);
      await homeyDevice.setCapabilityValue('light_saturation', params.saturation / SCALE_DEFAULT);
    }
    if (typeof params !== 'undefined' && typeof params.brightness !== 'undefined') {
      const homeyBrightness = params.brightness / SCALE_DEFAULT;
      await homeyDevice.setCapabilityValue('dim', homeyBrightness);
      if (homeyBrightness === 0) {
        let newState = new Map([]);
        newState.set([uc.Entities.Light.ATTRIBUTES.STATE], uc.Entities.Light.STATES.OFF);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      }
    }
    if (typeof params !== 'undefined' && typeof params.color_temperature !== 'undefined') {
      await homeyDevice.setCapabilityValue('light_temperature', params.color_temperature / SCALE_DEFAULT);
    }
    uc.acknowledgeCommand(wsHandle);
  }
  if (cmdId == 'off') {
    homeyDevice
      .setCapabilityValue('onoff', false)
      .then((r) => {
        uc.acknowledgeCommand(wsHandle);
      })
      .catch((e) => {
        uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.SERVER_ERROR);
      });
  }
}

async function ucFeaturesFromHomeyDevice(uc, homeyDevice) {
  let deviceFeatures = [];
  if (homeyDevice.capabilities.includes('onoff')) deviceFeatures.push(uc.Entities.Light.FEATURES.ON_OFF);
  if (homeyDevice.capabilities.includes('dim')) deviceFeatures.push(uc.Entities.Light.FEATURES.DIM);
  if (homeyDevice.capabilities.includes('light_hue')) deviceFeatures.push(uc.Entities.Light.FEATURES.COLOR);
  if (homeyDevice.capabilities.includes('light_temperature')) deviceFeatures.push(uc.Entities.Light.FEATURES.COLOR_TEMPERATURE);
  //if (homeyDevice.capabilities.includes("light_saturation")) deviceFeatures.push();
  //if (homeyDevice.capabilities.includes("light_mode")) deviceFeatures.push()

  return deviceFeatures;
}

async function ucStatesFromHomeyDevice(uc, homeyDevice) {
  let deviceStates = new Map([]);
  if (homeyDevice.capabilities.includes('onoff'))
    deviceStates.set([uc.Entities.Light.ATTRIBUTES.STATE], homeyDevice.capabilitiesObj.onoff.value ? uc.Entities.Light.STATES.ON : uc.Entities.Light.STATES.OFF);
  if (homeyDevice.capabilities.includes('dim')) deviceStates.set([uc.Entities.Light.ATTRIBUTES.DIM], parseInt(homeyDevice.capabilitiesObj.dim.value * SCALE_DEFAULT));
  if (homeyDevice.capabilities.includes('light_hue')) deviceStates.set([uc.Entities.Light.ATTRIBUTES.HUE], parseInt(homeyDevice.capabilitiesObj.light_hue.value * SCALE_HUE));
  if (homeyDevice.capabilities.includes('light_saturation')) deviceStates.set([uc.Entities.Light.ATTRIBUTES.SATURATION], parseInt(homeyDevice.capabilitiesObj.light_saturation.value * SCALE_DEFAULT));
  if (homeyDevice.capabilities.includes('light_temperature'))
    deviceStates.set([uc.Entities.Light.ATTRIBUTES.COLOR_TEMPERATURE], parseInt(homeyDevice.capabilitiesObj.light_temperature.value * SCALE_DEFAULT));
  return deviceStates;
}

module.exports.exposeHomeyDevice = exposeHomeyDevice;
module.exports.subscribeHomeyDevice = subscribeHomeyDevice;
module.exports.commandHomeyDevice = commandHomeyDevice;
