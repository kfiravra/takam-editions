// Settings come from the environment, each with a default. .env.example documents them.
import 'dotenv/config';

// `||` and not `??`: a variable left empty in .env (`PORT=`) counts as not set.
export const config = {
  port: Number(process.env.PORT || 3000),
  dataDir: process.env.DATA_DIR || 'data/sample',
  // The two below are read by the scripts only.
  takamBaseUrl: process.env.TAKAM_BASE_URL || 'https://takam.mof.gov.il',
  sofficePath: process.env.SOFFICE_PATH || 'soffice',
};
