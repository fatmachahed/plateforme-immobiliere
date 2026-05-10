const API_URL = `${API_URL}`;

export const getTypeBien = async () => {
  const res = await fetch(`${API_URL}/catalogue/types-bien`);
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/catalogue/categories`);
  return res.json();
};

export const getEtatBien = async () => {
  const res = await fetch(`${API_URL}/catalogue/etat-bien`);
  return res.json();
};

export const getGouvernorats = async () => {
  const res = await fetch(`${API_URL}/catalogue/gouvernorats`);
  return res.json();
};
