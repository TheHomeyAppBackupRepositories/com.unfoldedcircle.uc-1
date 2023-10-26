'use strict';

const Homey = require('homey');
const { HomeyAPI } = require('athom-api');
const uc = require('./uc_driver');

let debug = false;
let homeyApi = null;
let flowTrigger = null;

if (process.env.DEBUG === '1') {
  debug = true;
  //require('inspector').open(9228, '0.0.0.0', false);
}

class MyApp extends Homey.App {
  async getApi() {
    return HomeyAPI.forCurrentHomey(this.homey);
  }
  async onInit() {
    homeyApi = await this.getApi();
    flowTrigger = await this.homey.flow.getTriggerCard('start_flow');

    // When a flow trigger is triggered. validate the name of the trigger with the name of the uc button. if same then trigger is true.
    flowTrigger.registerRunListener(async (args, state) => {
      return args.name === state.name;
    });

    // Set the homeyApi and flowTrigger.
    await uc.setHomeyApi(homeyApi, flowTrigger);
    this.log('Remote Two app has been initialized');
  }
  async onUninit() {
    homeyApi = null;
    flowTrigger = null;
    this.log('Remote Two app has been uninitialized');
  }
}

module.exports = MyApp;
