const axios = require('axios');

class CreateAccount {
  constructor(userProfile) {
    this.moovClient = new Client();
    this.userProfile = userProfile;
    this.logger = Log.channel('moov');
  }

  // Checks if the account type is individual
  isIndividual() {
    return this.userProfile.entity_profile_type_id == 1;
  }

  // Executes the account creation process based on the account type
  execute() {
    if (this.isIndividual()) {
      return this.createIndividualAccount();
    }

    return this.createBusinessAccount();
  }

  // Creates an individual account by making a request to the Moov API
  createIndividualAccount() {
    const response = this.moovClient.createAccount(
      this.prepareIndividualAccountRequest()
    );
    const cleanedResponse = this.cleanResponse(response);

    this.logger.debug('Moov response', cleanedResponse);

    return cleanedResponse;
  }

  // Requests capabilities for the Moov account
  requestCapabilities() {
    const scopes = [
      `/accounts/${this.userProfile.moov_account_id}/profile.read`,
      `/accounts/${this.userProfile.moov_account_id}/profile.write`,
      `/accounts/${this.userProfile.moov_account_id}/capabilities.read`,
      `/accounts/${this.userProfile.moov_account_id}/capabilities.write`,
    ];
    this.moovClient.refreshAccessToken(scopes.join(','));
    const response = this.moovClient.requestCapabilities(
      this.userProfile.moov_account_id,
      {
        capabilities: ['transfers', 'send-funds', 'wallet'],
      }
    );
    const cleanedResponse = this.cleanResponse(response);

    this.logger.debug('RequestCapabilities response', cleanedResponse);
  }

  // Cleans the response from the Moov API
  cleanResponse(response) {
    return JSON.parse(response.getBody().getContents());
  }

  // Prepares the request for creating an individual account
  prepareIndividualAccountRequest() {
    const user = this.userProfile.user;
    const country = this.userProfile.country;
    const request = {
      accountType: 'individual',
      profile: {
        individual: {
          name: {
            firstName: this.userProfile.first_name,
            middleName: this.userProfile.middle_name,
            lastName: this.userProfile.last_name,
          },
          phone: {
            number: this.userProfile.phone,
            countryCode: country.phone_code,
          },
          email: user.email,
          address: {
            addressLine1: this.userProfile.address1,
            addressLine2: this.userProfile.address2,
            city: this.userProfile.city,
            stateOrProvince: this.userProfile.state.name,
            postalCode: this.userProfile.zipcode,
            country: country.iso2,
          },
          birthDate: {
            day: parseInt(this.userProfile.date_of_birth.format('d')),
            month: parseInt(this.userProfile.date_of_birth.format('M')),
            year: parseInt(this.userProfile.date_of_birth.format('YYYY')),
          },
        },
      },
      termsOfService: {
        token: getTosToken(),
      },
    };

    return request;
  }

  // Creates a business account by making a request to the Moov API
  createBusinessAccount = async () => {
    try {
      const user = userProfile.user;
      const description = userProfile.entity_tax_id_cr ? 'Investment Entity' : 'Family Trust';
      const country = userProfile.country;
      const entityAddress = userProfile.entityLegalAddress();
  
      const request = {
        accountType: 'business',
        profile: {
          business: {
            legalBusinessName: userProfile.entity_name,
            businessType: entityType.getMoovBusinessType(),
            phone: {
              number: userProfile.phone,
              countryCode: '1',
            },
            email: user.email,
            description: description,
            address: {
              addressLine1: entityAddress.address1,
              addressLine2: entityAddress.address2,
              city: entityAddress.city,
              stateOrProvince: entityAddress.state.name,
              postalCode: entityAddress.zipcode,
              country: country.iso2,
            },
            industryCodes: {
              mcc: '8999',
            },
            taxID: {
              ein: {
                number: userProfile.entity_tax_id_cr.replace(' ', ''),
              },
            },
          },
        },
        termsOfService: {
          token: getTosToken(),
        },
      };
  
      console.debug('Moov Business account request', request);
      return request;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to create business account');
    }
  };

  // Adds a beneficial owner to the Moov account
  addBeneficialOwner = async (moovAccountId) => {
    try {
      const user = userProfile.user;
      const scopes = [
        `/accounts/${moovAccountId}/profile.read`,
        `/accounts/${moovAccountId}/profile.write`,
        `/accounts/${moovAccountId}/representatives.read`,
        `/accounts/${moovAccountId}/representatives.write`,
      ];
      moovClient.refreshAccessToken(scopes.join(','));
  
      const response = await moovClient.addRepresentative(moovAccountId, {
        name: {
          firstName: userProfile.first_name,
          middleName: userProfile.middle_name,
          lastName: userProfile.last_name,
        },
        phone: {
          number: userProfile.phone,
          countryCode: '1',
        },
        email: user.email,
        address: {
            month:
            const createBusinessAccount = async () => {
                try {
                  const user = userProfile.user;
                  const description = userProfile.entity_tax_id_cr ? 'Investment Entity' : 'Family Trust';
                  const country = userProfile.country;
                  const entityAddress = userProfile.entityLegalAddress();
              
                  const request = {
                    accountType: 'business',
                    profile: {
                      business: {
                        legalBusinessName: userProfile.entity_name,
                        businessType: entityType.getMoovBusinessType(),
                        phone: {
                          number: userProfile.phone,
                          countryCode: '1',
                        },
                        email: user.email,
                        description: description,
                        address: {
                          addressLine1: entityAddress.address1,
                          addressLine2: entityAddress.address2,
                          city: entityAddress.city,
                          stateOrProvince: entityAddress.state.name,
                          postalCode: entityAddress.zipcode,
                          country: country.iso2,
                        },
                        industryCodes: {
                          mcc: '8999',
                        },
                        taxID: {
                          ein: {
                            number: userProfile.entity_tax_id_cr.replace(' ', ''),
                          },
                        },
                      },
                    },
                    termsOfService: {
                      token: getTosToken(),
                    },
                  };
              
                  console.debug('Moov Business account request', request);
                  return request;
                } catch (error) {
                  console.error(error);
                  throw new Error('Failed to create business account');
                }
              };
              
              const addBeneficialOwner = async (moovAccountId) => {
                try {
                  const user = userProfile.user;
                  const scopes = [
                    `/accounts/${moovAccountId}/profile.read`,
                    `/accounts/${moovAccountId}/profile.write`,
                    `/accounts/${moovAccountId}/representatives.read`,
                    `/accounts/${moovAccountId}/representatives.write`,
                  ];
                  moovClient.refreshAccessToken(scopes.join(','));
              
                  const response = await moovClient.addRepresentative(moovAccountId, {
                    name: {
                      firstName: userProfile.first_name,
                      middleName: userProfile.middle_name,
                      lastName: userProfile.last_name,
                    },
                    phone: {
                      number: userProfile.phone,
                      countryCode: '1',
                    },
                    email: user.email,
                    address: {
                      addressLine1: userProfile.address1,
                      addressLine2: userProfile.address2,
                      city: userProfile.city,
                      stateOrProvince: userProfile.state.state_code,
                      postalCode: userProfile.zipcode,
                      country: 'US',
                    },
                    birthDate: {
                      day: userProfile.date_of_birth.getDate(),
                      month: userProfile.date_of_birth.getMonth() + 1,
                      year: userProfile.date_of_birth.getFullYear(),
                    },
                    governmentID: {
                      ssn: {
                        full: userProfile.tax_id_cr.replace(' ', ''),
                        lastFour: userProfile.tax_id_cr.trim().slice(-4),
                      },
