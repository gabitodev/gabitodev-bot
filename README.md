# gabitodev-bot
## An Axie Infinity Discord bot that helps to manage your scholarship right in your discord server.
The discord bot will run in your local machine. You can deploy this bot in AWS if you want.
### Features
#### Scholar Commands
`/balance` shows the balance of the account. This command accepts one argument the `teamId` of the scholar team.

![image](https://user-images.githubusercontent.com/8563780/162335127-acd7054c-e7f4-430f-aaf0-5d61f4de0f4a.png)


`/battles-stats` returns a summary of the last 100 battles played by the scholar.

![image](https://user-images.githubusercontent.com/8563780/162335321-6a10831f-3598-4588-8bf3-4b3775119f2b.png)

#### Owner Commands
`/add-scholar` adds a scholar to the bot database. This command accepts three arguments:

* **Discord user**: the scholar discord user. **Required**.

* **Full Name**: the name of your scholar. **Required**.

* **Payout Address**: is where the scholar receives their payouts. Leave it blank if you don't already have this information. **Optional**.

![image](https://user-images.githubusercontent.com/8563780/162335576-832547bd-c89a-4bc4-b85d-895934402fcf.png)

`/add-team` adds a team to the bot database. This command accepts three arguments:

* **Team ID**: the team id of the account (account number) it cannot be repeated. **Required**.

* **Ronin address**: your team ronin address. **Required**.

* **Daily fee**: can be a percentage (example: 0.5 is 50%) or it can be a static number charged daily (example: 30 SLP). **Required**.

![image](https://user-images.githubusercontent.com/8563780/162335672-ae62ccd6-7978-45a5-8bb6-08413898a565.png)

`/assign-team` assign a team to scholar. This command accepts two arguments:

* **Team ID**: the team that will be assigned. **Required**.

* **Discord user**: scholar who will play with this team. **Required**.

![image](https://user-images.githubusercontent.com/8563780/162336610-cfbe83ff-150b-4205-b4b9-4eb51c824826.png)

`/get-battles` get the summary of the last 100 battles of one scholar. This command accepts only one argument:

* **Discord user**: the scholar whose battles will be shown. **Required**

![image](https://user-images.githubusercontent.com/8563780/162336788-8450c601-2a4b-4c0a-bab6-699861dbca2c.png)

`/get-scholar` get the information of one scholar. This command only accepts one argument:

* **Discord user**: the scholar whose information will be shown. **Required**

![image](https://user-images.githubusercontent.com/8563780/162337849-051755fc-ed73-4247-a180-d99c6074b3a3.png)

`/payout` get all the scholars who are ready to payout.

![image](https://user-images.githubusercontent.com/8563780/162338031-3bfeb055-a65b-4bf9-934f-70ce0ffd6fbf.png)

`/remove-scholar` kicks scholar from the discord server and removes from the database.  This command only accepts one argument:

* **Discord user**: the scholar who will be deleted and kicked. **Required**

![image](https://user-images.githubusercontent.com/8563780/162338811-49ab83f8-a667-4d65-aeb0-e9c0d3ac5bf4.png)

`/remove-team` kicks scholar from the discord server and removes from the database.  This command only accepts one argument:

* **Team ID**: the account number to delete. **Required**

![image](https://user-images.githubusercontent.com/8563780/162339283-570d0bec-a08e-43a9-bda0-07d84e399862.png)

`/summary` shows the summary of your scholarship.

![image](https://user-images.githubusercontent.com/8563780/162339357-2101d752-e03d-43f9-8f1b-d66f253516c2.png)

`top-3` shows the best top 3 of your scholarship order by MMR.

![image](https://user-images.githubusercontent.com/8563780/162339416-0435c387-bb9b-4e0e-ab79-c4ee899c0019.png)

`/update-free-days` Assign free days to a team if this team is charged a daily fee. This command accepts two arguments:

* **Team ID**: the account number to add the days without daily fee. **Required**

* **Free days**: the ammount of days. **Required**

![image](https://user-images.githubusercontent.com/8563780/162339558-ad7de48e-6456-469e-b172-e8bf799fa724.png)

`/update-scholar-address` updates the payout address of one scholar. This command accepts two arguments:

* **Discord User**: the scholar who payout address will be changed. **Required**

* **Payout address**: the new payout address. **Required**

![image](https://user-images.githubusercontent.com/8563780/162339908-76565f3c-c803-483a-824f-a6954517eb90.png)

`/update-scholarship` updates the database with the game information of each scholar.

![image](https://user-images.githubusercontent.com/8563780/162339931-3eb17039-da97-4bee-98af-99cd107ed691.png)

I recommend to run this command before run `/summary` command because this ensures that the database has the latest information from the Axie Servers.

`/update-team-fee` updates fee of one team. This command accepts two arguments:

* **Team ID**: the account number to update the daily fee. **Required**

* **Daily fee**: can be a percentage (example: 0.5 is 50%) or it can be a static number charged daily (example: 30 SLP). **Required**.

![image](https://user-images.githubusercontent.com/8563780/162340173-299b01e3-780c-46a0-9d75-b93f8523216f.png)

### Necessary tools to run the bot
#### Windows 10
1. Download NodeJS from the official website: https://nodejs.org/es/download/. Install the LTS version.
2. Download Git for windows from the official website: https://gitforwindows.org/. Follow the steps to install git.
#### Linux
##### Node JS
1. Open your Ubuntu command line (or distribution of your choice).
2. Install cURL (a tool used for downloading content from the internet in the command-line) with: sudo `apt-get install curl`
3. Install nvm, with: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`
4. To verify installation, enter: `command -v nvm` ...this should return 'nvm', if you receive 'command not found' or no response at all, close your current terminal, reopen it, and try again.
5. Install the current stable LTS release of Node.js (recommended for production applications): `nvm install --lts`.
##### Git
For the latest stable Git version in Ubuntu/Debian, enter the command:
```Bash
sudo apt-get install git
```
### Downloading the Code
In your terminal opened to the folder you want to install the bot to, run the following command:
```CMD
git clone https://github.com/gabitodev/gabitodev-bot.git
```
Enter yes and wait for the download to end. Leave your terminal open and follow the following steps.
### Bot Setup
#### Setting up a Discord Bot Account
1. Navigate to the Discord developer portal website and login with your main Discord account: https://discord.com/developers/applications.
2. Click the New Application button at the top right:
   
   ![image](https://user-images.githubusercontent.com/8563780/162317136-4373626f-9f7a-4d7f-880c-60e470c64d69.png "New Application Button")
3. Name your bot and click Create. This should be named after your scholarship program.
4. Go to the Bot section on the left-side menu:

   ![image](https://user-images.githubusercontent.com/8563780/162320423-275012d1-dc06-4c10-b954-b3cd86322c2c.png "Bot Section")
5. In the bot section click the Add Bot button:

   ![image](https://user-images.githubusercontent.com/8563780/162321199-e5b00e88-4720-45c4-86c1-0da4bf47ebf1.png "Add Bot Button")
6. Name your bot and proceed to reset the bot token:

   ![image](https://user-images.githubusercontent.com/8563780/162322546-7119e7b5-fe30-42e2-9369-4f695f87d3d7.png)
7. As soon you click reset token you need to copy the new generated token and save it for now in notepad. You will need this for later.
#### Create the URL to Invite your Bot
1. Go to the OAuth2 page from the left menu:

   ![image](https://user-images.githubusercontent.com/8563780/162323888-77958a62-0aab-403a-9f56-1688b30ccdef.png)
2. Copy your client ID and save it in your notepad:

   ![image](https://user-images.githubusercontent.com/8563780/162325239-fde9fef0-9e1f-4a39-b92e-a297c73991a7.png)
3. Click on the URL Generator and select the bot and applications.commands scopes. The first gives the account bot privileges and the second allows for slash commands.

   ![image](https://user-images.githubusercontent.com/8563780/162325504-68045770-e28e-404c-a441-b9192f0a55a5.png)
4. Select all the permissions the bot needs to run, shown below:

   ![image](https://user-images.githubusercontent.com/8563780/162326207-94d51f08-0021-43dd-8fe8-6971db4d435b.png)
5. Copy the bottom URL and paste it in the browser of your preference. This will bring you to a Discord menu to select which server to add your bot to. Only servers you have permissions to add bots on will be displayed. Select your server and confirm.

   ![image](https://user-images.githubusercontent.com/8563780/162326049-9fcd4784-ba2d-4235-81e3-41cd3735331d.png)

Now the bot is in your discord sever but at the moment it doesn't work. We need to setup the code for the bot first.
### Setting up de code for the Bot
#### Filling out the env
First, you will need to fill out your env file. The bot comes with an example.env file. Rename to env.
You will need to add your bot token, the client ID for the bot, the scholar role ID of your scholars in your discord server and the guild ID of your server (ID of your discord server).
See the `example.env` file for more information.
#### Install the necessary dependencies
In your terminal where you bot was downloaded, run the followind command:
```CMD
npm install
```
If the process fail, try again.
This will install all of the necessary dependencies to run the bot.
#### Create the tables
Run the following command: `npm run create-tables`.
This structures the database to work with the bot.
#### Import scholar and team data
Make sure that you already create the tables for the database. 

If you have a large Scholarship progam, you may want to import the data in advance rather then add each scholar and team one by one. You will need to make a CSV file where you put all the information. Follow this format:

For scholars:

   ![image](https://user-images.githubusercontent.com/8563780/162329832-1eb44e1f-cab2-494f-a667-fe6b4a7c4002.png)
   
`discordId` the scholar discord id, you can get this directly from discord. If you dont know how to get this Google is yours best friend. **Required**.

`fullName` the name of your scholar. **Required**.

`payoutAddress` is where the scholar receives their payouts. Leave it blank if you don't already have this information. **Optional**.

For teams:

   ![image](https://user-images.githubusercontent.com/8563780/162330144-96a930d1-8815-4f49-a3f4-bc082b2dd5ff.png)

`teamId` the team id of the account (account number) it cannot be repeated. **Required**.

`roninAddress` your team ronin address. **Required**.

`daily fee` can be a percentage (example: 0.5 is 50%) or it can be a static number charged daily (example: 30 SLP). **Optional**.

`renterDiscordId` the scholar discord id who plays with this team. You can add this information later. **Optional**.

Download this two CSV files and paste it inside the database folder where you downloaded the bot.
Now run in your terminal the following command: `npm run import-tables`.
This will create the database with the data that you supplied.
If you want to delete your database simply delete the db file in your bot folder or rerun the `npm run import-tables` command.
## Run the bot
Now that we have all set run in your terminal the following command to put the bot online:
```CMD
npm run start
```
This will launch the bot and now you and your scholars can use it in your discord server.
