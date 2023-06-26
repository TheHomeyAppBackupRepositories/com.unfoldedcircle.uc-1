'use strict';

const tools = require('./tools');

const SCALE_DEFAULT = 255;

let eventListeners = [];

async function exposeHomeyDevice(uc, homeyDevice) {
  const deviceName = new Map([['en', `${homeyDevice.zoneName}, ${homeyDevice.name}`]]);
  const deviceFeatures = await ucFeaturesFromHomeyDevice(uc, homeyDevice);
  const deviceStates = await ucStatesFromHomeyDevice(uc, homeyDevice);
  const ucEntityId = `mediaplayer|${homeyDevice.id}`;
  const deviceClass = undefined;
  const deviceOptions = null;
  const deviceArea = homeyDevice.zoneName;
  const ucEntity = new uc.Entities.MediaPlayer(ucEntityId, deviceName, deviceFeatures, deviceStates, deviceClass, deviceOptions, deviceArea);
  uc.availableEntities.addEntity(ucEntity);
}

async function ucFeaturesFromHomeyDevice(uc, homeyDevice) {
  let deviceFeatures = [];
  if (homeyDevice.capabilities.includes('onoff')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.ON_OFF);
  if (homeyDevice.capabilities.includes('speaker_album')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_ALBUM);
  if (homeyDevice.capabilities.includes('speaker_album')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_IMAGE_URL);
  if (homeyDevice.capabilities.includes('speaker_duration')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_DURATION);
  if (homeyDevice.capabilities.includes('speaker_next')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.NEXT);
  if (homeyDevice.capabilities.includes('speaker_playing')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_TITLE);
  if (homeyDevice.capabilities.includes('speaker_track')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_ARTIST);
  if (homeyDevice.capabilities.includes('speaker_playing')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_TYPE);
  if (homeyDevice.capabilities.includes('speaker_position')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MEDIA_POSITION);
  if (homeyDevice.capabilities.includes('speaker_prev')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.PREVIOUS);
  if (homeyDevice.capabilities.includes('speaker_repeat')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.REPEAT);
  if (homeyDevice.capabilities.includes('volume_set')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.VOLUME);
  if (homeyDevice.capabilities.includes('volume_mute')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.MUTE);
  if (homeyDevice.capabilities.includes('volume_mute')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.UNMUTE);
  if (homeyDevice.capabilities.includes('speaker_shuffle')) deviceFeatures.push(uc.Entities.MediaPlayer.FEATURES.SHUFFLE);
  return deviceFeatures;
}

async function ucStatesFromHomeyDevice(uc, homeyDevice) {
  let deviceStates = new Map([]);

  if (homeyDevice.capabilities.includes('onoff'))
    deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.STATE], homeyDevice.capabilitiesObj.onoff.value ? uc.Entities.MediaPlayer.STATES.ON : uc.Entities.MediaPlayer.STATES.OFF);

  if (homeyDevice.capabilities.includes('speaker_album')) deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.MEDIA_IMAGE_URL], tools.grabHomeyDeviceImage(homeyDevice)); //grabHomeyDeviceImage

  if (homeyDevice.capabilities.includes('speaker_playing'))
    deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.STATE], homeyDevice.capabilitiesObj.speaker_playing.value ? uc.Entities.MediaPlayer.STATES.PLAYING : uc.Entities.MediaPlayer.STATES.OFF);

  if (homeyDevice.capabilities.includes('speaker_repeat')) {
    if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'none') deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'OFF');
    if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'track') deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'ONE');
    if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'playlist') deviceStates.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'ALL');
  }

  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_album');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_duration');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_position');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_track');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_artist');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'volume_set', 100);
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'volume_mute');
  deviceStates = tools.addUcState(homeyDevice, deviceStates, 'speaker_shuffle');

  return deviceStates;
}

async function subscribeHomeyDevice(uc, homeyDevice, ucEntityId) {
  if (!eventListeners.includes(ucEntityId)) {
    if (homeyDevice.capabilities.includes('onoff')) {
      homeyDevice.makeCapabilityInstance('onoff', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.STATE], value ? uc.Entities.MediaPlayer.STATES.ON : uc.Entities.MediaPlayer.STATES.OFF);
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('speaker_playing')) {
      homeyDevice.makeCapabilityInstance('speaker_playing', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.STATE], value ? uc.Entities.MediaPlayer.STATES.PLAYING : uc.Entities.MediaPlayer.STATES.OFF); //uc.Entities.MediaPlayer.STATES.PAUSED;
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('speaker_track')) {
      homeyDevice.makeCapabilityInstance('speaker_track', (value) => {
        let newState = new Map([]);
        newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.MEDIA_TITLE], value);
        newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.MEDIA_IMAGE_URL], tools.grabHomeyDeviceImage(homeyDevice));
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }
    if (homeyDevice.capabilities.includes('speaker_repeat')) {
      homeyDevice.makeCapabilityInstance('speaker_repeat', (value) => {
        let newState = new Map([]);
        if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'none') newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'OFF');
        if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'track') newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'ONE');
        if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'playlist') newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.REPEAT], 'ALL');
        uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
      });
    }

    // basic events. (no code handling needed.)
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'volume_mute');
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'volume_set', 100);
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'speaker_album');
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'speaker_artist');
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'speaker_duration');
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'speaker_position');
    tools.basicHomeyToYioEventBuilder(homeyDevice, ucEntityId, 'speaker_shuffle');

    eventListeners.push(ucEntityId);
  }
}

async function commandHomeyDevice(uc, homeyDevice, wsHandle, ucEntityId, ucEntityType, cmdId, params) {
  try {
    if (cmdId == 'on') await homeyDevice.setCapabilityValue('speaker_playing', true);
    if (cmdId == 'off') {
      await homeyDevice.setCapabilityValue('speaker_playing', false);
      let newState = new Map([]);
      newState.set([uc.Entities.MediaPlayer.ATTRIBUTES.STATE], 'OFF');
      uc.configuredEntities.updateEntityAttributes(ucEntityId, newState);
    }
    if (cmdId == 'mute_toggle') await homeyDevice.setCapabilityValue('volume_mute', !homeyDevice.capabilitiesObj.volume_mute.value);
    if (cmdId == 'play_pause') await homeyDevice.setCapabilityValue('speaker_playing', !homeyDevice.capabilitiesObj.speaker_playing.value);
    if (cmdId == 'volume') await homeyDevice.setCapabilityValue('volume_set', params.volume / 100);
    if (cmdId == 'shuffle') await homeyDevice.setCapabilityValue('speaker_shuffle', !homeyDevice.capabilitiesObj.speaker_shuffle.value);
    if (cmdId == 'next') await homeyDevice.setCapabilityValue('speaker_next', true);
    if (cmdId == 'previous') await homeyDevice.setCapabilityValue('speaker_prev', true);
    if (cmdId == 'repeat') {
      let repeat = 'none';
      if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'none') repeat = 'track';
      if (homeyDevice.capabilitiesObj.speaker_repeat.value == 'track') repeat = 'playlist';
      await homeyDevice.setCapabilityValue('speaker_repeat', repeat);
    }

    uc.acknowledgeCommand(wsHandle);
  } catch (e) {
    uc.acknowledgeCommand(wsHandle, uc.STATUS_CODES.SERVER_ERROR);
  }
}

module.exports.exposeHomeyDevice = exposeHomeyDevice;
module.exports.subscribeHomeyDevice = subscribeHomeyDevice;
module.exports.commandHomeyDevice = commandHomeyDevice;
