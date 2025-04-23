import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, type, message } = body;
    const timestamp = new Date().toISOString();
    
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // Debug: Log environment variable status (safe partial logging)
    console.log('Environment variables check:');
    console.log('- GOOGLE_SERVICE_ACCOUNT_KEY exists:', !!serviceAccountKey);
    console.log('- GOOGLE_SERVICE_ACCOUNT_KEY length:', serviceAccountKey ? serviceAccountKey.length : 0);
    console.log('- GOOGLE_SHEET_ID exists:', !!spreadsheetId);
    // Don't log the actual Sheet ID value
    
    if (!serviceAccountKey) {
      throw new Error('Google service account key is missing');
    }
    
    if (!spreadsheetId) {
      throw new Error('Google Sheet ID is missing');
    }
    
    // Attempt to parse the service account key to validate JSON format
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log('Service account key parsed successfully');
      // Don't log any credential details
    } catch {
      console.error('Failed to parse service account key');
      throw new Error('Invalid service account key format');
    }
    
    // Log attempt to help with debugging
    console.log('Attempting to connect to Google Sheets with spreadsheet ID:', spreadsheetId);
    
    // Set up auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // Create client
    const sheets = google.sheets('v4');
    
    // Append data to the sheet
    const response = await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Sheet1!A:E', // Adjust range as needed
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, type, message]],
      },
    });
    
    console.log('Successfully wrote to Google Sheets:', response.data);
    
    return NextResponse.json({ 
      success: true,
      message: 'Form submitted successfully'
    });
  } catch (error: unknown) {
    console.error('Error submitting to Google Sheets');
    
    // Provide more detailed error information without leaking sensitive data
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      // Only log the error message, not the stack trace
      errorMessage = error.message;
      console.error('Error type:', error.name);
    }
    
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: errorMessage,
      // Don't include debug details in the response
    }, { status: 500 });
  }
} 