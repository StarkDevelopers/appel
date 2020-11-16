import config from './config';

async function handleErrors(response) {
  if (!response.ok) {
    response = await response.json();
    response = JSON.stringify(response && response.message ? response.message : response);
    throw new Error(response ? response : "Internal server error");
  }
  return response;
}

export default ({ path, ...args }) => (
  fetch(`${config.API_SERVER}${path}`, {
    method: 'GET',
    ...args,
  })
  .then(handleErrors)
  .then(res => res.json())
);
