//  localisation.api.js 
import API from "./axios";

export const getGouvernorats = () =>
  API.get("/localisation/gouvernorats");

export const getDelegations = (gouvernoratId) =>
  API.get("/localisation/delegations", {
    params: { gouvernorat_id: gouvernoratId }
  });

export const getLocalites = (delegationId) =>
  API.get("/localisation/localites", {
    params: { delegation_id: delegationId }
  });
