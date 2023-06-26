'use strict';

async function exposeHomeyDevice(uc, homeyDevice) {
  const deviceName = new Map([['en', `${homeyDevice.zoneName}, ${homeyDevice.name}`]]);
  const deviceFeatures = await ucSwitchFeaturesFromHomeyDevice(uc, homeyDevice);
  const deviceStates = await ucSwitchStatesFromHomeyDevice(uc, homeyDevice);
  const ucEntityId = `socket|${homeyDevice.id}`;
  const deviceClass = undefined;
  const deviceOptions = null;
  const deviceArea = homeyDevice.zoneName;
  const ucEntity = new uc.Entities.Switch(ucEntityId, deviceName, deviceFeatures, deviceStates, deviceClass, deviceOptions, deviceArea);
  uc.availableEntities.addEntity(ucEntity);
}

let eventListeners = [];
let debugEventObj = {}; //for testing

async function subscribeHomeyDevice(uc, homeyDevice, ucEntityId) {
  if (!eventListeners.includes(ucEntityId)) {
    if (homeyDevice.capabilities.includes('onoff')) {
      debugEventObj[ucEntityId] = homeyDevice.makeCapabilityInstance('onoff', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.Switch.ATTRIBUTES.STATE], value ? uc.Entities.Switch.STATES.ON : uc.Entities.Switch.STATES.OFF);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
  }
  eventListeners.push(ucEntityId);
}

async function commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params) {
  if (cmdId == 'toggle') {
    if (homeyDevice.capabilitiesObj.onoff.value) {
      cmdId = 'off';
    } else {
      cmdId = 'on';
    }
  }

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
}

async function ucSwitchFeaturesFromHomeyDevice(uc, homeyDevice) {
  let deviceFeatures = [];
  if (homeyDevice.capabilities.includes('onoff')) deviceFeatures.push(uc.Entities.Switch.FEATURES.ON_OFF);
  return deviceFeatures;
}

async function ucSwitchStatesFromHomeyDevice(uc, homeyDevice) {
  let deviceStates = new Map([]);
  if (homeyDevice.capabilities.includes('onoff'))
    deviceStates.set([uc.Entities.Switch.ATTRIBUTES.STATE], homeyDevice.capabilitiesObj.onoff.value ? uc.Entities.Switch.STATES.ON : uc.Entities.Switch.STATES.OFF);
  return deviceStates;
}

module.exports.commandHomeyDevice = commandHomeyDevice;
module.exports.subscribeHomeyDevice = subscribeHomeyDevice;
module.exports.exposeHomeyDevice = exposeHomeyDevice;
