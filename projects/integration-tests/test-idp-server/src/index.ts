import { TestIdpServer } from './TestIdpServer';

// Start the server if run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '8080', 10);
  const server = new TestIdpServer({
    port,
    realms: ['idp1', 'idp2', 'idp3']
  });
  
  server.start().then(() => {
    console.log(`Test IDP server is running on port ${port}`);
    console.log('Press Ctrl+C to stop the server');
    
    process.on('SIGINT', async () => {
      console.log('\nStopping server...');
      await server.stop();
      process.exit(0);
    });
  }).catch(console.error);
}

export { TestIdpServer };