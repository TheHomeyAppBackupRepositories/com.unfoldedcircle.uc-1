'use strict';

async function add(uc, homeyApi) {
  let flowTrigers = [];
  const homeyFlowsAll = await homeyApi.flow.getFlows();
  for (let i in homeyFlowsAll) {
    const homeyFlow = homeyFlowsAll[i];
    if (homeyFlow.trigger.uri == 'homey:app:com.unfoldedcircle.uc') {
      const triggerName = homeyFlow.trigger.args.name;
      if (!flowTrigers.includes(triggerName)) {
        flowTrigers.push(triggerName);
        await addPushEntity(uc, triggerName);
      }
    }
  }
}
module.exports.add = add;

async function addPushEntity(uc, triggerName) {
  const ucEntityId = `flow|${triggerName}`;
  const flowName = `Trigger: ${triggerName}`;
  const ucEntity = new uc.Entities.Button(ucEntityId, new Map([['en', flowName]]));
  uc.availableEntities.addEntity(ucEntity);
}
