sim:
	npx hardhat run scripts/maintenance/cheapRebalanceOperations.js --network mainnet

d:
	npm run test
t:
	npx hardhat run scripts/maintenance/eth-transfer.js --network mainnet