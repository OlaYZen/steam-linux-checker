# Steam Linux Compatibility Checker

A web application that helps Linux users check the compatibility of their Steam games with Linux/Proton. The application provides a beautiful interface to view your Steam library, sort games by various criteria, and check their compatibility status.

## Features

- **Steam Account Integration**
  - Connect multiple Steam accounts
  - View combined game libraries
  - Automatic game library updates
  - Account management (add/remove/refresh)
  - Requires public Steam library visibility for game data access

- **Game Information**
  - ProtonDB compatibility ratings (Platinum, Gold, Silver, Bronze)
  - Current Steam player counts
  - Total playtime across accounts
    - Hover over playtime to see individual hours per account (for games owned by multiple accounts)
  - Game launch functionality
  - Beautiful game cards with cover art

- **Sorting & Filtering**
  - Sort by:
    - Playtime (highest first by default)
    - Name (A-Z)
    - Active Players
    - Compatibility Tier
  - Search functionality with real-time filtering
  - Toggle sort direction (ascending/descending)

- **User Interface**
  - Modern, Steam-inspired design
  - Responsive layout
  - Toast notifications for actions
  - Loading states and error handling
  - Dark theme optimized for gaming

## Data Storage

### Server-side Storage
The server uses in-memory caching for API responses to improve performance and reduce API calls:
- Steam user information (1 hour cache)
- Game library data (1 hour cache)
- ProtonDB compatibility ratings (1 hour cache)
- Active player counts (1 hour cache)

### Browser Storage (localStorage)
The application stores the following data locally in your browser:

- **Steam Account Information**
  - Steam ID
  - Username
  - Avatar URL
  - Profile URL

- **Game Library Data**
  - Game AppID
  - Game Name
  - Total Playtime
  - Account ownership information
  - Last update timestamp

All data is stored in your browser's localStorage and is not sent to any external servers except for:
- Steam API (for authentication and game data)
- ProtonDB API (for compatibility information)
- Steam API (for active player counts)

## Privacy & Security

- **Authentication & Data Access**
  - No account passwords are stored
  - Uses Steam's OpenID for secure authentication
  - All API calls are made server-side
  - Account data is stored locally in your browser and persists until manually removed
  - Requires public Steam library visibility for game data access

- **Data Protection**
  - No personal data is stored on the server
  - All sensitive operations are performed server-side
  - API keys and secrets are stored in environment variables
  - HTTPS recommended for production deployment
  - Regular security updates and dependency checks

- **User Control**
  - You can remove your data at any time by:
    - Removing individual accounts
    - Clearing your browser's localStorage
  - No data is shared with third parties except:
    - Steam API (for authentication and game data)
    - ProtonDB API (for compatibility information)
    - Steam API (for active player counts)
  - You can disconnect your Steam account at any time
  - Server-side cache (1 hour) only affects:
    - Game library data
    - ProtonDB compatibility ratings
    - Active player counts
    - User profile images
  - Your account data remains in your browser until you choose to remove it

- **Transparency**
  - Open source code for full transparency
  - Clear documentation of data handling
  - No hidden data collection
  - No analytics or tracking
  - No cookies used for tracking purposes

## Technical Details

### Backend
- Python Flask server
- Caching for API responses
- Environment variable configuration
- Error handling and logging

### Frontend
- Vanilla JavaScript (ES6+)
- CSS3 with modern features
- Responsive design
- Progressive enhancement

### APIs Used
- Steam Web API
- ProtonDB Community API
- Steam OpenID

## Setup

1. **Prerequisites**
   - Python 3.8 or higher
   - A Steam account with a public profile
   - A Steam Web API key (get one from [Here](https://steamcommunity.com/dev/apikey))

2. **Installation**

   Clone the repository:
   ```bash
   git clone https://github.com/olayzen/steam-linux-checker.git
   cd steam-linux-checker/
   ```

   Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configuration**
   Open the `.env` file and insert your key generated earlier:
   ```
   STEAM_API_KEY=your_steam_api_key
   ```

4. **Running the Application**
   ```bash
   python app.py
   ```

5. **Accessing the Application**
   - Open your browser and navigate to `http://localhost:5000`
   - Click "Connect Steam Account" to begin
   - Make sure your Steam profile is set to public for game data access

6. **Troubleshooting**
   - If you get API errors, verify your Steam API key is correct
   - Ensure your Steam profile is set to public
   - Check that all dependencies are installed correctly
   - Verify your Python version is 3.8 or higher

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari

## Contributing

Feel free to submit issues and pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 