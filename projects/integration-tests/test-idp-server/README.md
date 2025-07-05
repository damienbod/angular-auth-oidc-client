# Test IDP Server

## Usage

### Server Management Scripts

The server now includes shell scripts for managing the server lifecycle:

```bash
# Start the server (finds available port, tracks PID)
./start.sh

# Stop the server
./stop.sh

# Restart the server
./restart.sh

```

## Endpoints

Management endpoints:
- `/health` - Token endpoint  

Each realm provides the following endpoints:

- `/{realm}/.well-known/openid-configuration` - OIDC discovery
- `/{realm}/authorize` - Authorization endpoint
- `/{realm}/token` - Token endpoint  
- `/{realm}/jwks` - JWKS endpoint
- `/{realm}/userinfo` - UserInfo endpoint
- `/{realm}/logout` - Logout endpoint
