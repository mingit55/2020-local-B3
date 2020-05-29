Date.prototype.getLocalTime = function(){
    let Y = this.getFullYear();
    let m = this.getMonth() + 1;
    let D = this.getDate();

    let h = this.getHours();
    let i = this.getMinutes();
    let s = this.getSeconds();

    if(m < 10) m = "0" + m;
    if(D < 10) D = "0" + D;
    if(h < 10) h = "0" + h;
    if(i < 10) i = "0" + i;
    if(s < 10) s = "0" + s;
    
    return `${Y}-${m}-${D} ${h}:${i}:${s}`;
};

class App {
    constructor(){
        this.init();
    }

    async init(){
        this.$dropArea = $("#drop-area");
        this.$cartList = $("#cartlist");
        this.$storeList = $("#storelist"); 
        this.cartList = [];
        this.keyword = "";

        this.products = await this.getProducts();

        this.storeUpdate();
        this.cartUpdate();
        this.setEvent();
    }

    getProducts(){
        return fetch("/json/store.json")
            .then(res => res.json())
            .then(json => json.map(jsonItem => new Product(this, jsonItem)));
    }

    storeUpdate(){
        let viewList = this.products;
        viewList.forEach(item => item.init());
        

        if(this.keyword !== ""){
            let regex = new RegExp(this.keyword);
            console.log(regex);
            viewList = viewList
                .filter(product => regex.test(product.init_data.product_name) || regex.test(product.init_data.brand))
                .map(product => {
                    product.product_name = product.init_data.product_name.replace(regex, m1 => `<span class="bg-gold">${m1}</span>`);
                    product.brand = product.init_data.brand.replace(regex, m1 => `<span class="bg-gold">${m1}</span>`);
                    return product;
                });

        }

        this.$storeList.html("");
        if(viewList.length > 0){
            viewList.forEach(product => {
                product.storeUpdate();
                this.$storeList.append(product.$storeElem);
            });
        } else {
            this.$storeList.html(`<p class="text-center py-4 col-12">일치하는 상품이 없습니다.</p>`);
        }
    }

    cartUpdate(){
        let total = this.cartList.reduce((p, c) => p + c.price * c.buyCount, 0);
        
        this.$cartList.html("");

        if(this.cartList.length > 0) {
            this.cartList.forEach(cartItem => {
                cartItem.cartUpdate();
                this.$cartList.append(cartItem.$cartElem);
            });
        } else {
            this.$cartList.html(`<div class="cell-100 text-center py-4">장바구니에 담긴 상품이 없습니다.</div>`);
        }

        $(".total-price").text(total.toLocaleString());
    }

    setEvent(){
        // # 드래그 앤 드롭
        let dragTarget;
        let startPoint;
        this.$storeList.on("dragstart", ".store-item .image", (e) => {
            e.preventDefault();
            dragTarget = e.currentTarget;
            startPoint = [e.pageX, e.pageY];
        });

        $(window).on("mousemove", e => {
            if(!dragTarget || !startPoint || e.which !== 1 ) return;

            let x = e.pageX - startPoint[0];
            let y = e.pageY - startPoint[1];
            $(dragTarget).css({
                left: x + "px",
                top: y + "px",
                zIndex: '1500'
            })
        });

        let dropTimeout;
        $(window).on("mouseup", e => {
            if(!dragTarget || !startPoint || e.which !== 1 ) return;

            let {offsetWidth, offsetHeight} = this.$dropArea[0];
            let {left, top} = this.$dropArea.offset();

            // 드롭 영역에 떨궈졌을 때
            if(left <= e.pageX && e.pageX <= left + offsetWidth && top <= e.pageY && e.pageY <= top + offsetHeight) {
                if(dropTimeout) {
                    clearTimeout(dropTimeout);
                }

                let id = dragTarget.dataset.id;
                let product = this.products.find(product => product.id == id);

                this.$dropArea.removeClass("success");
                this.$dropArea.removeClass("error");
                
                if(!this.cartList.some(cartItem => cartItem == product)){
                    product.setBuyCount(1);
                    this.cartList.push(product);
                    this.cartUpdate();
                
                    this.$dropArea.addClass("success");
                    dropTimeout = setTimeout(() => this.$dropArea.removeClass("success"), 1500);
                } else {
                    this.$dropArea.addClass("error");
                    dropTimeout = setTimeout(() => this.$dropArea.removeClass("error"), 1500);
                }
            
                
                $(dragTarget).css({left: 0, top: 0, transform: "scale(0.1)", zIndex: "0"});
                let temp = dragTarget;
                setTimeout(() => {
                    temp.style.transition = "transform 0.4s";
                    temp.style.transform = "scale(1)";
                    setTimeout(() => {
                        temp.style.transition = "none";
                    }, 400);
                });
                
            } else {
                $(dragTarget).animate({
                    left: 0,
                    top: 0
                }, 400, function(){
                    $(this).css("zIndex", "0")
                });
            }

            dragTarget = null;
            startPoint = null;
        });

        
        // # 장바구니 수량
        this.$cartList.on("input", ".buy-count", e => {
            let value = parseInt(e.target.value);
            let id = e.target.dataset.id;
            let product = this.products.find(product => product.id == id);
            product.setBuyCount(value);
            
            this.cartUpdate();
            e.target.focus();
        });

        // # 장바구니 삭제
        this.$cartList.on("click", ".remove-btn", e => {
            let id = e.target.dataset.id;
            let idx = this.cartList.findIndex(item => item.id == id );
            if(idx >= 0){
                let product = this.cartList[idx];
                product.buyCount = 0;
                product.cartUpdate();

                this.cartList.splice(idx, 1);
                this.cartUpdate();
            }
        });


        // # 구매하기
        $("#buy-modal form").on("submit", e => {
            e.preventDefault(); 

            const PADDING = 30;
            const TEXT_SIZE = 15;
            const TITLE_SIZE = 24;
            const TEXT_GAP = 10;
            const TITLE_GAP = 30;

            let cursor = PADDING * 2 + TITLE_SIZE + TITLE_GAP;

            let canvas = document.createElement("canvas");
            canvas.width = 450;
            canvas.height = cursor;

            let ctx = canvas.getContext('2d');
            ctx.font = `${TEXT_SIZE}px 나눔스퀘어, sans-serif`;

            let cartList = [];
            let totalPrice = 0;
            this.cartList.forEach(cartItem => {
                totalPrice += cartItem.price * cartItem.buyCount;
                cartList.push({
                    label: cartItem.init_data.product_name,
                    text: `${cartItem.price.toLocaleString()}원 × ${cartItem.buyCount.toLocaleString()}개 = ${(cartItem.price * cartItem.buyCount).toLocaleString()}원`,
                });
                cartItem.buyCount = 0;
                cartItem.cartUpdate();
            });

            let showList = [];
            [
                ...cartList,
                {label: "구매일시", text: new Date().getLocalTime()},
                {label: "총 금액", text: totalPrice.toLocaleString() + "원"}
            ].forEach(({label, text}) => {
                let ms = ctx.measureText(text);
                let x = canvas.width - ms.width - PADDING;
                let y = cursor;

                cursor += TEXT_SIZE + TEXT_GAP;
                showList.push({x, y, text, label});
            });

            canvas.height = cursor + PADDING;

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#d6b443";
            ctx.font = `${TITLE_SIZE}px 나눔스퀘어, sans-serif`;
            ctx.fillText("구매 내역", PADDING, PADDING + TITLE_SIZE);
            
            ctx.fillStyle = "#333333";
            ctx.font = `${TEXT_SIZE}px 나눔스퀘어, sans-serif`;
            showList.forEach(item => {
                ctx.fillText(item.label, PADDING, item.y);
                ctx.fillText(item.text, item.x, item.y);
            });


            this.cartList = [];
            this.cartUpdate();
            
            let url = canvas.toDataURL('image/png');
            $("#purchase-modal img").attr("src", url);
            $("#purchase-modal").modal("show");

            $("#buy-modal").modal('hide');
        });

        // # 검색
        $(".search input").on("input", e => {
            this.keyword = e.target.value
                .replace(/([\^\.+*\(\)\[\]\\\\\\/])/g, '\\$1')
                .replace(/(ㄱ)/g, "[가-깋]")
                .replace(/(ㄴ)/g, "[나-닣]")
                .replace(/(ㄷ)/g, "[다-딯]")
                .replace(/(ㄹ)/g, "[라-맇]")
                .replace(/(ㅁ)/g, "[마-밓]")
                .replace(/(ㅂ)/g, "[바-빟]")
                .replace(/(ㅅ)/g, "[사-싷]")
                .replace(/(ㅇ)/g, "[아-잏]")
                .replace(/(ㅈ)/g, "[자-짛]")
                .replace(/(ㅊ)/g, "[차-칳]")
                .replace(/(ㅋ)/g, "[카-킿]")
                .replace(/(ㅌ)/g, "[타-팋]")
                .replace(/(ㅍ)/g, "[파-핗]")
                .replace(/(ㅎ)/g, "[하-힣]")
            this.storeUpdate();
        });
    }
}

window.onload = function(){
    const store = new App();
};