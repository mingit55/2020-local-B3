class Product {
    buyCount = 0;
    constructor(app, json){
        json.price = parseInt(json.price.replace(/[^0-9]/g, ""));
        this.init_data = json;

        this.app = app;
        this.init();
        this.storeUpdate();
        this.cartUpdate();
    }

    init(){
        const {product_name, price, brand, photo, id} = this.init_data;

        this.product_name = product_name;
        this.price = price;
        this.brand = brand;
        this.photo = photo;
        this.id = id;
    }
    
    setBuyCount(val){
        if(isNaN(val) || typeof val !== 'number' || val < 1){
            val = 1;
        }
        this.buyCount = val;
    }

    storeUpdate(){
        const {product_name, price, brand, photo, id} = this;

        if(!this.$storeElem) {
            this.$storeElem = $(`
                <div class="col-lg-4 col-md-6 mt-5">
                    <div class="store-item">
                        <div class="image" draggable="draggable" data-id="${id}">
                            <img class="fit-cover" src="./images/products/${photo}" alt="상품 이미지" title="상품 이미지">
                        </div>
                        <div class="mt-3 px-2 d-between">
                            <div>
                                <span class="brand text-muted fx-n2">${brand}</span>
                                <div class="product_name fx-3">${product_name}</div>
                            </div>
                            <div>
                                <span class="fx-5 text-darkgold">${price.toLocaleString()}</span>
                                <span class="text-muted">원</span>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        } else {
            this.$storeElem.find(".brand").html(brand);
            this.$storeElem.find(".product_name").html(product_name);
        }
    }   

    cartUpdate(){
        const {product_name, price, brand, photo, id} = this.init_data;
        const total = (price * this.buyCount).toLocaleString();

        if(!this.$cartElem){
            this.$cartElem = $(`<div class="table-row">
                                    <div class="cell-50">
                                        <div class="d-flex align-items-center px-4">
                                            <img src="./images/products/${photo}" alt="상품 이미지" title="상품 이미지" class="table-image">
                                            <div class="ml-4 text-left">
                                                <div class="text-muted fx-n1">${brand}</div>
                                                <div class="fx-3">${product_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="cell-15">
                                        <span class="fx-2">${price.toLocaleString()}</span>
                                        <small class="text-muted">원</small>
                                    </div>
                                    <div class="cell-10">
                                        <input type="number" class="buy-count" min="1" value="${this.buyCount.toLocaleString()}" data-id="${id}">
                                    </div>
                                    <div class="cell-15">
                                        <span class="total fx-2 text-darkgold">${total}</span>
                                        <small class="text-muted">원</small>
                                    </div>
                                    <div class="cell-10">
                                        <button class="remove-btn text-muted" data-id="${id}">&times;</button>
                                    </div>
                                </div>`);
        } else {
            this.$cartElem.find(".buy-count").val(this.buyCount.toLocaleString());
            this.$cartElem.find(".total").text(total);
        }
    }
}