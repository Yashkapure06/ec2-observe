import { EC2Client } from "@aws-sdk/client-ec2";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import { STSClient } from "@aws-sdk/client-sts";

// Get environment variables with better error handling
const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Log configuration for debugging
console.log("AWS Configuration:");
console.log("Region:", region);
console.log(
  "Access Key ID:",
  accessKeyId ? `${accessKeyId.substring(0, 8)}...` : "NOT SET"
);
console.log("Secret Access Key:", secretAccessKey ? "SET" : "NOT SET");

// Validate required credentials
if (!accessKeyId || !secretAccessKey) {
  console.error("❌ AWS credentials are missing!");
  console.error("Please check your .env.local file");
  throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required");
}

// Create AWS clients with explicit credentials
const awsConfig = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
};

export const ec2Client = new EC2Client(awsConfig);
export const cloudWatchClient = new CloudWatchClient(awsConfig);
export const costExplorerClient = new CostExplorerClient(awsConfig);
export const stsClient = new STSClient(awsConfig);

export const getCurrentAccountId = async (): Promise<string> => {
  try {
    const command = new (
      await import("@aws-sdk/client-sts")
    ).GetCallerIdentityCommand({});
    const response = await stsClient.send(command);
    return response.Account || "unknown";
  } catch (error) {
    console.error("Failed to get AWS account ID:", error);
    return "unknown";
  }
};

export const validateCredentials = async (): Promise<boolean> => {
  try {
    await getCurrentAccountId();
    return true;
  } catch (error) {
    console.error("AWS credentials validation failed:", error);
    return false;
  }
};
