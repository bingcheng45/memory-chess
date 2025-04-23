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
    console.log('- GOOGLE_SHEET_ID value:', spreadsheetId);
    
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
      console.log('- project_id:', credentials.project_id);
      console.log('- client_email:', credentials.client_email);
    } catch (parseError) {
      console.error('Failed to parse service account key:', parseError);
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
    console.error('Error submitting to Google Sheets:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined
      };
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        // If error can't be stringified
        errorMessage = 'Error object cannot be stringified';
      }
    }
    
    console.error('Detailed error:', { errorMessage, errorDetails });
    
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
} 