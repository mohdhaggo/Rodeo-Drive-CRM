const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Load credentials from AWS config
const credentialsPath = path.join(process.env.USERPROFILE || process.env.HOME, '.aws', 'credentials');
const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.aws', 'config');

try {
  // Read credentials file
  const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
  const profileMatch = credentialsContent.match(/\[Rodeo-Drive-CRM\]([\s\S]*?)(?=\[|$)/);
  
  if (profileMatch) {
    const accessKeyMatch = profileMatch[1].match(/aws_access_key_id\s*=\s*(.+)/);
    const secretKeyMatch = profileMatch[1].match(/aws_secret_access_key\s*=\s*(.+)/);
    
    if (accessKeyMatch && secretKeyMatch) {
      AWS.config.update({
        accessKeyId: accessKeyMatch[1].trim(),
        secretAccessKey: secretKeyMatch[1].trim(),
        region: 'ap-southeast-1'
      });
    }
  }
} catch (e) {
  console.error('Could not load credentials:', e.message);
}

const cognito = new AWS.CognitoIdentityServiceProvider();

const params = {
  UserPoolId: 'ap-southeast-1_zm5O8BokR',
  Username: 'mohd.haggo@gmail.com',
  TemporaryPassword: 'TempPass@123',
  MessageAction: 'SUPPRESS'
};

cognito.adminCreateUser(params, (err, data) => {
  if (err) {
    console.error('Error creating user:', err.message);
  } else {
    console.log('✅ User created successfully!');
    console.log('Username:', data.User.Username);
    console.log('UserStatus:', data.User.UserStatus);
    
    // Now set permanent password
    const setPasswordParams = {
      UserPoolId: 'ap-southeast-1_zm5O8BokR',
      Username: 'mohd.haggo@gmail.com',
      Password: 'Password@123',
      Permanent: true
    };
    
    cognito.adminSetUserPassword(setPasswordParams, (err, data) => {
      if (err) {
        console.error('Error setting password:', err.message);
      } else {
        console.log('✅ Password set permanently!');
        console.log('\n📋 User Details:');
        console.log('Email: mohd.haggo@gmail.com');
        console.log('Password: Password@123');
        console.log('Employee ID: RD00350');
        console.log('Department: IT');
        console.log('Role: Administrator');
      }
    });
  }
});
