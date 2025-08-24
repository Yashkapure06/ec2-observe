import { NextResponse } from "next/server";
import { getCurrentAccountId, validateCredentials } from "@/lib/aws";

export async function GET() {
  try {
    console.log("Testing AWS credentials...");

    // Test credential validation
    const isValid = await validateCredentials();
    if (!isValid) {
      return NextResponse.json(
        { error: "AWS credentials validation failed" },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getCurrentAccountId();

    console.log(`AWS credentials valid. Account ID: ${accountId}`);

    return NextResponse.json({
      success: true,
      message: "AWS credentials are working!",
      accountId,
      region: process.env.AWS_REGION || "us-east-1",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AWS test error:", error);
    return NextResponse.json(
      {
        error: "AWS test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
