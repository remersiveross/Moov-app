const axios = require('axios');

// Class for creating a Moov account
class CreateAccount {
  constructor(userProfile) {
    this.userProfile = userProfile;
    this.moovClient = new Client();
    this.logger = Log.channel('moov');
  }

  // Check if the account is for an individual
  isIndividual() {
    return this.userProfile.entity_profile_type_id == 1;
  }

  // Execute the account creation process
  execute() {
    if (this.isIndividual()) {
      return this.createIndividualAccount();
    }

    return this.createBusinessAccount();
  }

  // Create an individual account
  createIndividualAccount() {
    const response = this.moovClient.createAccount(
      this.prepareIndividualAccountRequest()
    );
    const cleanedResponse = this.cleanResponse(response);

    this.logger.debug('Moov response', cleanedResponse);

    return cleanedResponse;
  }

  // Request capabilities for the account
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

  // Clean the response by parsing it as JSON
  cleanResponse(response) {
    return JSON.parse(response.body);
  }

  // Prepare the request for creating an individual account
  prepareIndividualAccountRequest() {
    const request = {
      accountType: 'individual',
      profile: {
        individual: {
          firstName: this.userProfile.first_name,
          lastName: this.userProfile.last_name,
          phone: {
            number: this.userProfile.phone,
            countryCode: '1',
          },
          email: this.userProfile.user.email,
          address: {
            addressLine1: this.userProfile.address1,
            addressLine2: this.userProfile.address2,
            city: this.userProfile.city,
            stateOrProvince: this.userProfile.state.state_code,
            postalCode: this.userProfile.zipcode,
            country: 'US',
          },
          birthDate: {
            day: this.userProfile.date_of_birth.getDate(),
            month: this.userProfile.date_of_birth.getMonth() + 1,
            year: this.userProfile.date_of_birth.getFullYear(),
          },
          governmentID: {
            ssn: {
              full: this.userProfile.tax_id_cr.replace(/[- ]/g, ''),
            },
          },
        },
      },
      termsOfService: {
        token: this.getTosToken(),
      },
    };

    this.logger.debug('Moov Individual account request', request);
    return request;
  }

  // Get the terms of service token
  getTosToken() {
    const tosResponse = this.moovClient.getTermsOfServiceToken();
    return JSON.parse(tosResponse.body).token;
  }

  // Create a business account
  createBusinessAccount() {
    const response = this.moovClient.createAccount(
      this.prepareBusinessAccountRequest()
    );
    const cleanedResponse = this.cleanResponse(response);

    this.logger.debug('Moov response', cleanedResponse);

    this.addBeneficialOwner(cleanedResponse.accountID);

    return cleanedResponse;
  }

  // Prepare the request for creating a business account
  prepareBusinessAccountRequest() {
    if (!this.userProfile.entityType) {
      throw new Error('Entity type not found while creating business account');
    }

    const description = this.userProfile.entity_tax_id_cr
      ? 'Investment Entity'
      : 'Family Trust';
    const entityAddress = this.userProfile.entityLegalAddress();
    const request = {
      accountType: 'business',
      profile: {
        business: {
          legalBusinessName: this.userProfile.entity_name,
          businessType: this.userProfile.entityType.getMoovBusinessType(),
          phone: {
            number: this.userProfile.phone,
            countryCode: '1',
          },
          email: this.userProfile.user.email,
          description: description,
          address: {
            addressLine1: entityAddress.address1,
            addressLine2: entityAddress.address2,
            city: entityAddress.city,
            stateOrProvince: entityAddress.state.name,
            postalCode: entityAddress.zipcode,
            country: entityAddress.country.iso2,
          },
          industryCodes: {
            mcc: '8999',
          },
          taxID: {
            ein: {
              number: this.userProfile.entity_tax_id_cr.replace(/ /g, ''),
            },
          },
        },
      },
      termsOfService: {
        token: this.getTosToken(),
      },
    };

    this.logger.debug('Moov Business account request', request);
    return request;
  }

addBeneficialOwner(moovAccountId) {
  const scopes = [
    `/accounts/${moovAccountId}/profile.read`,
    `/accounts/${moovAccountId}/profile.write`,
    `/accounts/${moovAccountId}/representatives.read`,
    `/accounts/${moovAccountId}/representatives.write`,
  ];
  this.moovClient.refreshAccessToken(scopes.join(','));

  const response = this.moovClient.addRepresentative(moovAccountId, {
    name: {
      firstName: this.userProfile.first_name,
      middleName: this.userProfile.middle_name,
      lastName: this.userProfile.last_name,
    },
    phone: {
      number: this.userProfile.phone,
      countryCode: '1',
    },
    email: this.userProfile.user.email,
    address: {
      addressLine1: this.userProfile.address1,
      addressLine2: this.userProfile.address2,
      city: this.userProfile.city,
      stateOrProvince: this.userProfile.state.state_code,
      postalCode: this.userProfile.zipcode,
      country: 'US',
    },
    birthDate: {
      day: this.userProfile.date_of_birth.getDate(),
      month: this.userProfile.date_of_birth.getMonth() + 1,
      year: this.userProfile.date_of_birth.getFullYear(),
    },
    governmentID: {
      ssn: {
        full: this.userProfile.tax_id_cr.replace(/ /g, ''),
        lastFour: this.userProfile.tax_id_cr.trim().slice(-4),
      },
    },
    responsibilities: {
      isController: true,
      isOwner: true,
      ownershipPercentage: 100,
      jobTitle: this.userProfile.title || 'Owner',
    },
  });
  this.logger.debug(
    'Moov addBeneficialOwner response',
    this.cleanResponse(response)
  );

  const responsePatch = this.moovClient.patchAccount(moovAccountId, {
    profile: {
      business: {
        ownersProvided: true,
      },
    },
  });
  this.logger.debug(
    'Moov patchAccount response',
    this.cleanResponse(responsePatch)
  );
}
}
