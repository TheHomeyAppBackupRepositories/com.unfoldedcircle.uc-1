'use strict';

module.exports.config = {
  driver_id: 'uc_homey_driver',
  version: '1.0.3',
  min_core_api: '0.0.1',
  name: { en: 'Athom Homey' },
  icon: 'custom:homey.png',
  description: {
    en: 'Control your homey with Remote Two.',
  },
  port: '8099',
  developer: {
    name: 'Unfolded Circle ApS',
    email: 'hello@unfoldedcircle.com',
    url: 'https://www.unfoldedcircle.com',
  },
  home_page: 'https://www.unfoldedcircle.com',
  setup_data_schema: {
    title: {
      en: 'Integration setup',
    },
    settings: [
      {
        id: 'info',
        label: {
          en: 'Setup process',
        },
        field: {
          label: {
            value: {
              en: 'The integration will discover your homey on your network.',
            },
          },
        },
      },
    ],
  },
  release_date: '2023-04-23',
};
