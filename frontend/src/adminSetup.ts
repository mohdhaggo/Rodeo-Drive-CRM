/**
 * Admin User Database Setup
 * Run this from the browser console or integrate into your app
 * 
 * Usage: In browser console, run:
 * import { adminSetupService } from './amplifyService.ts'
 * adminSetupService.setupAdminUser({
 *   email: 'Mohd.haggo@gmail.com',
 *   firstName: 'Rodeo',
 *   lastName: 'Administrator'
 * })
 */

import { adminSetupService } from './amplifyService';

export async function setupAdminUserInDatabase() {
  const adminUser = {
    email: 'Mohd.haggo@gmail.com',
    firstName: 'Rodeo',
    lastName: 'Administrator',
  };

  try {
    console.log('🚀 Starting admin user database setup...');
    console.log('Admin Details:', adminUser);

    const result = await adminSetupService.setupAdminUser(adminUser);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN USER DATABASE SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📋 Setup Results:');
    console.log('User ID:', result.user?.id);
    console.log('Role ID:', result.role?.id);
    console.log('Department ID:', result.department?.id);
    console.log('Message:', result.message);
    console.log('\n' + '='.repeat(60));

    return result;
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    throw error;
  }
}

// Export for manual use
export default setupAdminUserInDatabase;
