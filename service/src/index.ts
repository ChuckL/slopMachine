import 'dotenv/config';
import { appConfig } from './appConfig';
import { expressApp } from './expressApp';

expressApp.listen(appConfig.port, () => {
  console.log(`Service running on http://localhost:${appConfig.port}`);
});
