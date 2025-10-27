/**
 * Global application configuration settings.
 * This file provides a centralized place to manage environment-specific variables,
 * feature flags, and other global constants.
 */
export const config = {
  /**
   * The base URL for the PHP Coin backend API.
   * Change this value to easily switch between development, staging, or production servers.
   */
  apiBaseUrl: 'http://phpcoin.net:5000/api.php',
  

  /**
   * The base URL for the blockchain explorer for transactions.
   * Used for linking to transaction details.
   */
  explorerUrl: 'https://explorer.phpcoin.net/tx/',
  
  /**
   * The base URL for the blockchain explorer for addresses.
   * Used for linking to owner wallet details.
   */
  explorerAddressUrl: 'https://explorer.phpcoin.net/address/',
  
  /**
   * The default domain extension for the network.
   * Used for mock data and for automatically appending to searches.
   */
  defaultDomainExtension: '.phpcoin',

  // You can add other global settings here in the future.
  // For example:
  // featureFlags: {
  //   enableExperimentalFeature: false,
  // },


  chainId: '01'
};
