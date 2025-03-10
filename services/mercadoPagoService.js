const axios = require('axios');
const mercadoPagoToken = 'SEU_ACCESS_TOKEN';

const MercadoPago = {
    createPixPayment: async (amount, description, payerEmail) => {
        try {
          const response = await axios.post(
            'https://api.mercadopago.com/v1/payments',
            {
              transaction_amount: amount,
              description: description,
              payment_method_id: "pix",
              payer: {
                email: payerEmail // Agora o e-mail pode ser dinâmico
              },
              external_reference: `tournament-${Date.now()}` // Referência externa única
            },
            {
              headers: {
                Authorization: `Bearer ${mercadoPagoToken}`,
                "Content-Type": "application/json"
              }
            }
          );
    
          return {
            id: response.data.id,
            qr_code: response.data.point_of_interaction.transaction_data.qr_code_base64,
            pix_code: response.data.point_of_interaction.transaction_data.qr_code
          };
        } catch (error) {
          console.error('Erro ao criar pagamento PIX:', error.response?.data || error.message);
          return null;
        }
      }
};

module.exports = MercadoPago;
