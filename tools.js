'use strict';

const interfaces = require('os').networkInterfaces();
const uc = require('uc-integration-api');

const translateCapabilities = {
  speaker_album: 'media_album',
  volume_mute: 'muted',
  volume_set: 'volume',
  speaker_duration: 'media_duration',
  speaker_track: 'media_title',
  speaker_artist: 'media_artist',
  speaker_repeat: 'repeat',
  speaker_shuffle: 'shuffle',
  speaker_position: 'media_position',
};

async function basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, homeyCapability, multiplier) {
  if (homeyDevice.capabilities.includes(homeyCapability)) {
    homeyDevice.makeCapabilityInstance(homeyCapability, (value) => {
      if (multiplier) value = value * multiplier;
      let newState = new Map([]);
      newState.set([translateCapabilities[homeyCapability]], value);
      uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
    });
  }
}

function addUcState(homeyDevice, deviceStates, homeyCapability, multiplier) {
  if (homeyDevice.capabilities.includes(homeyCapability)) {
    try {
      let value = homeyDevice.capabilitiesObj[homeyCapability].value;
      if (multiplier) value = value * multiplier;
      deviceStates.set([translateCapabilities[homeyCapability]], value);
    } catch (e) {
      console.warn('Error adding UC State:', e);
    }
  }
  return deviceStates;
}

function getLocalIp() {
  for (const iA in interfaces) {
    const iface = interfaces[iA];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
    }
  }
  return '0.0.0.0';
}

function grabHomeyDeviceImage(homeyDevice) {
  let url = '';
  if (homeyDevice?.images[0]?.imageObj?.url) {
    url = `http://${getLocalIp()}${homeyDevice.images[0].imageObj.url}?${Date.now()}`;
  }
  return url;
}

function grabHomeyDeviceIcon(homeyDevice) {
  let url = '';
  if (homeyDevice && homeyDevice.iconObj && homeyDevice.iconObj.url) {
    url = `http://${getLocalIp()}${homeyDevice.iconObj.url}?${Date.now()}`;
  }
  return url;
}

module.exports.grabHomeyDeviceImage = grabHomeyDeviceImage;
module.exports.grabHomeyDeviceIcon = grabHomeyDeviceIcon;
module.exports.basicHomeyToYioEventBuilder = basicHomeyToYioEventBuilder;
module.exports.addUcState = addUcState;
