/**
 * Parse lỗi từ backend và trả về message thân thiện cho user
 */
export const parseErrorMessage = (error: any): string => {
  // Kiểm tra nếu có response từ backend
  if (error.response?.data) {
    const { message, error: errorMsg, errors } = error.response.data;
    
    // Xử lý các lỗi cụ thể từ backend
    if (message) {
      // Wallet errors
      if (message.includes('Insufficient balance') || message.includes('insufficient balance')) {
        return 'Số dư trong ví không đủ để thanh toán. Vui lòng nạp thêm tiền.';
      }
      
      if (message.includes('Product is not available') || message.includes('not available')) {
        return 'Sản phẩm không còn khả dụng hoặc đã được bán.';
      }
      
      if (message.includes('Transaction not found')) {
        return 'Không tìm thấy giao dịch. Vui lòng thử lại.';
      }
      
      if (message.includes('Payment failed')) {
        return 'Thanh toán thất bại. Vui lòng kiểm tra lại thông tin và thử lại.';
      }

      // Auth errors
      if (message.includes('Invalid credentials') || message.includes('wrong password')) {
        return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      }
      
      if (message.includes('User already exists') || message.includes('email already')) {
        return 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
      }
      
      if (message.includes('Unauthorized') || message.includes('unauthorized')) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      }

      // Validation errors
      if (message.includes('required') || message.includes('missing')) {
        return 'Vui lòng điền đầy đủ thông tin bắt buộc.';
      }
      
      if (message.includes('Invalid email')) {
        return 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.';
      }
      
      if (message.includes('Password') && message.includes('short')) {
        return 'Mật khẩu quá ngắn. Vui lòng nhập ít nhất 6 ký tự.';
      }

      // Product errors
      if (message.includes('Product not found')) {
        return 'Không tìm thấy sản phẩm. Sản phẩm có thể đã bị xóa.';
      }
      
      if (message.includes('Cannot delete') || message.includes('cannot delete')) {
        return 'Không thể xóa sản phẩm này. Vui lòng thử lại sau.';
      }

      // Network/Server errors
      if (message.includes('Network') || message.includes('network')) {
        return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      }
      
      // Nếu có message từ backend nhưng chưa được xử lý cụ thể
      return message;
    }
    
    if (errorMsg) {
      return errorMsg;
    }
    
    // Nếu có nhiều lỗi validation
    if (errors && Array.isArray(errors)) {
      return errors.map((e: any) => e.message || e.msg).join('. ');
    }
  }
  
  // Lỗi network
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
  }
  
  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Kết nối quá lâu. Vui lòng thử lại.';
  }
  
  // Lỗi 500
  if (error.response?.status >= 500) {
    return 'Server đang gặp sự cố. Vui lòng thử lại sau.';
  }
  
  // Lỗi 404
  if (error.response?.status === 404) {
    return 'Không tìm thấy tài nguyên yêu cầu.';
  }
  
  // Lỗi 403
  if (error.response?.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  
  // Lỗi mặc định
  return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
};

/**
 * Kiểm tra xem có phải lỗi không đủ tiền hay không
 */
export const isInsufficientBalanceError = (error: any): boolean => {
  const message = error.response?.data?.message || '';
  return message.includes('Insufficient balance') || message.includes('insufficient balance');
};

/**
 * Kiểm tra xem có phải lỗi sản phẩm không khả dụng hay không
 */
export const isProductUnavailableError = (error: any): boolean => {
  const message = error.response?.data?.message || '';
  return message.includes('Product is not available') || message.includes('not available');
};
