import * as appSchema from './schema/app';
import * as configSchema from './schema/config';

const schema = {
  ...appSchema,
  ...configSchema,
};

export default schema;
