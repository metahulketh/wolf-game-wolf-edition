# Wolf Game Watcher Bot

This repository hosts the code for a Discord bot designed to provide tooling and support for the Wolf Game community. The current implementation includes a bot that watches specific game-related metrics and updates Discord channels accordingly. The long-term goal is to develop a suite of Discord bots and tools to enhance the Wolf Game experience.

> Please note: This is not an official Wolf Game project.

## Features

- Watches and updates game-related metrics in real-time.
- Provides timely notifications and updates to a designated Discord channel.
- Customizable to monitor various aspects of the Wolf Game ecosystem.

## Getting Started

### Prerequisites

- Node.js
- npm (Node.js package manager)
- A Discord account and a Discord server where you have permissions to add bots.

### Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/metahulketh/wolf-game-wolf-edition.git
   cd wolf-game-wolf-edition

2. **Navigate to the Bot Directory**
```sh
cd src/wolf-game-watcher
```

3. **Install Dependencies**
```sh
npm install
```
4. **Set Up Environment Variables**

Create a `.env` file in the `src/wolf-game-watcher` directory with the following variables:
```plaintext
DISCORD_WOLF_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id
ETHERSCAN_API_KEY=your_etherscan_api_key
WOLF_GAME_API_KEY=your_wolf_game_api_key
SIGNER_PRIVATE_KEY=your_signer_private_key
SIGNER_ADDRESS=your_signer_address
```
Replace **your_*** with actual values relevant to your setup.

5. **Run the Bot**
```sh
node index
```
## Contribution
Contributions are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository.
Create a new branch for your feature (`git checkout -b feature/AmazingFeature`).
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
3. Push to the branch (`git push origin feature/AmazingFeature`).
4. Open a Pull Request.
5. Please ensure your code adheres to the project's coding standards and include appropriate tests and documentation.

## License
This project is licensed under the MIT License - see the LICENSE file for details.