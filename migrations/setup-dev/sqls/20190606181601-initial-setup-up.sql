CREATE USER 'starter-kit'@'localhost' IDENTIFIED BY '3k293cp0tjnMq';
/* 
Deployed versions should not assign a password to the starter kit user
They should assign no password and use IAM authentication instead 
*/

GRANT ALL PRIVILEGES ON `starter-kit`.* TO 'starter-kit'@'localhost' IDENTIFIED BY '3k293cp0tjnMq';
GRANT ALL PRIVILEGES ON `starter-kit`.* TO 'starter-kit'@'%' IDENTIFIED BY '3k293cp0tjnMq' WITH GRANT OPTION;
