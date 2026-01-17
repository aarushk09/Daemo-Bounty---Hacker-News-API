import "reflect-metadata";
import 'dotenv/config';
import { DaemoBuilder, DaemoHostedConnection } from 'daemo-engine';
import { HackerNewsFunctions } from './services/MyFunctions';

async function main() {
  const hnService = new HackerNewsFunctions();

  const sessionData = new DaemoBuilder()
    .withServiceName("HackerNewsCurator")
    .registerService(hnService)
    .build();

  if (!process.env.DAEMO_AGENT_API_KEY) {
    console.error("error check .env file location");
    process.exit(1);
  }

  const connection = new DaemoHostedConnection(
    { 
      agentApiKey: process.env.DAEMO_AGENT_API_KEY, 
      daemoGatewayUrl: "https://engine.daemo.ai:50052/"
    },
    sessionData
  );

  await connection.start();
  console.log("🚀 Agent online!");
}

main().catch(console.error);
