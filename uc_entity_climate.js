'use strict';

const SCALE_DEFAULT = 255;

let eventListeners = [];

async function exposeHomeyDevice(uc, homeyDevice) {
  const deviceName = new Map([['en', `${homeyDevice.zoneName}, ${homeyDevice.name}`]]);
  const deviceFeatures = await ucFeaturesFromHomeyDevice(uc, homeyDevice);
  const deviceStates = await ucStatesFromHomeyDevice(uc, homeyDevice);
  const ucEntityId = `climate|${homeyDevice.id}`;
  const deviceClass = undefined;
  const deviceOptions = null;
  const deviceArea = homeyDevice.zoneName;
  const ucEntity = new uc.Entities.Climate(ucEntityId, deviceName, deviceFeatures, deviceStates, deviceClass, deviceOptions, deviceArea);
  uc.availableEntities.addEntity(ucEntity);
}

async function subscribeHomeyDevice(uc, homeyDevice, ucEntityId) {
  if (!eventListeners.includes(ucEntityId)) {
    if (homeyDevice.capabilities.includes('onoff')) {
      homeyDevice.makeCapabilityInstance('onoff', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Climate.ATTRIBUTES.STATE], value ? uc.Entities.Climate.STATES.ON : uc.Entities.Climate.STATES.OFF);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('fan_speed')) {
      homeyDevice.makeCapabilityInstance('fan_speed', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Climate.ATTRIBUTES.FAN], value);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('target_temperature')) {
      homeyDevice.makeCapabilityInstance('target_temperature', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Climate.ATTRIBUTES.TARGET_TEMPERATURE], uctemp(value));
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('measure_temperature')) {
      homeyDevice.makeCapabilityInstance('measure_temperature', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Climate.ATTRIBUTES.CURRENT_TEMPERATURE], value);
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
      .then((r) => {
        uc.acknowledgeCommand(wsHandle);
      })
      .catch((e) => {
        uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.SERVER_ERROR);
      });
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
  if (cmdId == 'target_temperature') {
    homeyDevice
      .setCapabilityValue('target_temperature', params.temperature)
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
  if (homeyDevice.capabilities.includes('onoff')) deviceFeatures.push(uc.Entities.Climate.FEATURES.ON_OFF);
  if (homeyDevice.capabilities.includes('fan_speed')) deviceFeatures.push(uc.Entities.Climate.FEATURES.FAN);
  if (homeyDevice.capabilities.includes('target_temperature')) {
    deviceFeatures.push(uc.Entities.Climate.FEATURES.TARGET_TEMPERATURE);
    deviceFeatures.push(uc.Entities.Climate.FEATURES.TARGET_TEMPERATURE_RANGE);
  }
  if (homeyDevice.capabilities.includes('measure_temperature')) deviceFeatures.push(uc.Entities.Climate.FEATURES.CURRENT_TEMPERATURE);
  return deviceFeatures;
}

async function ucStatesFromHomeyDevice(uc, homeyDevice) {
  let deviceStates = new Map([]);
  if (homeyDevice.capabilities.includes('onoff'))
    deviceStates.set([uc.Entities.Climate.ATTRIBUTES.STATE], homeyDevice.capabilitiesObj.onoff.value ? uc.Entities.Climate.STATES.AUTO : uc.Entities.Climate.STATES.OFF);
  if (homeyDevice.capabilities.includes('fan_speed')) deviceStates.set([uc.Entities.Climate.ATTRIBUTES.FAN], parseInt(homeyDevice.capabilitiesObj.fan_speed.value * SCALE_DEFAULT));
  if (homeyDevice.capabilities.includes('target_temperature')) {
    deviceStates.set([uc.Entities.Climate.ATTRIBUTES.TARGET_TEMPERATURE], uctemp(homeyDevice.capabilitiesObj.target_temperature.value));
    deviceStates.set([uc.Entities.Climate.ATTRIBUTES.TARGET_TEMPERATURE_HIGH], homeyDevice.capabilitiesObj.target_temperature.max);
    deviceStates.set([uc.Entities.Climate.ATTRIBUTES.TARGET_TEMPERATURE_LOW], homeyDevice.capabilitiesObj.target_temperature.min);
    deviceStates.set([uc.Entities.Climate.OPTIONS.MAX_TEMPERATURE], homeyDevice.capabilitiesObj.target_temperature.max);
    deviceStates.set([uc.Entities.Climate.OPTIONS.MIN_TEMPERATURE], homeyDevice.capabilitiesObj.target_temperature.min);
  }
  if (homeyDevice.capabilities.includes('measure_temperature')) deviceStates.set([uc.Entities.Climate.ATTRIBUTES.CURRENT_TEMPERATURE], homeyDevice.capabilitiesObj.measure_temperature.value);

  deviceStates.set([uc.Entities.Climate.ATTRIBUTES.STATE], uc.Entities.Climate.STATES.AUTO);
  return deviceStates;
}

function uctemp(temperature) {
  let newTemperature = parseInt(temperature);
  let digit = temperature - newTemperature;
  if (digit >= 0.25 && digit <= 0.75) newTemperature = newTemperature + 0.5;
  if (digit > 0.75) newTemperature = newTemperature + 1;
  if (digit <= -0.25 && digit >= -0.75) newTemperature = newTemperature - 0.5;
  if (digit < -0.75) newTemperature = newTemperature - 1;
  return newTemperature;
}

module.exports.exposeHomeyDevice = exposeHomeyDevice;
module.exports.subscribeHomeyDevice = subscribeHomeyDevice;
module.exports.commandHomeyDevice = commandHomeyDevice;
