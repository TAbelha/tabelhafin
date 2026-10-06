export const load = async ({ locals }) => {
  return {
    nonce: locals.nonce ?? "",
  };
};
