console.log("hello World");
const searchBar=document.getElementById("searchBar");
const searchMenu=document.getElementById("search-dropdown");
const List=document.getElementById("BookList");
const Id=document.querySelectorAll(".booklist");


//console.log(Id[0].id);

searchBar.addEventListener("input",()=>{
    //console.log("called");
    let query=searchBar.value;
    if(query.length >2){
        searchMenu.classList.add('show');
        const API_KEY="AIzaSyDSrrAjYH67U9TlLGt3NwvYRIBwBHluG2U";
        let url=`https://www.googleapis.com/books/v1/volumes?q=${query}&key${API_KEY}`;
        fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            searchMenu.innerHTML='';
            data.items.forEach(element => {
                let a=document.createElement('a');
                a.className="dropdown-item p-1"
                let title=element.volumeInfo.title;
                let author=element.volumeInfo.authors[0];
                let imgURL= element.volumeInfo.imageLinks.thumbnail;
                let id=element.id;
                console.log(title,author,id);
                a.href=`/books/${id}`;
                a.innerHTML=`
                <div class="container">
                    <div class="row">
                        <div class="col-1 me-4">
                            <img src="${imgURL}" alt="book-cover" height="100" width="80">
                        </div>
                        <div class="col-6 ms-5">
                            <strong class="pt-3">${title}</strong>
                            <p class="py-3">${author}</p>
                        </div>
                    </div>
                `;
                searchMenu.appendChild(a);
            });
        })
    }
    else{
        searchMenu.classList.remove('show');
    }
})
function createList(Id){
    Id.forEach(element=>{
        let id =element.id;
        let  a=document.getElementById(id);
        let url=`https://www.googleapis.com/books/v1/volumes/${id}`;
        fetch(url)
        .then(response => response.json())
        .then(element => {
            let title=element.volumeInfo.title;
            let author=element.volumeInfo.authors[0];
            let imgURL= element.volumeInfo.imageLinks.thumbnail;
            a.innerHTML=`
                <div class="container">
                    <div class="row">
                        <div class="col-1 me-4">
                            <img src="${imgURL}" alt="book-cover" height="100" width="80">
                        </div>
                        <div class="col-6 ms-5">
                            <strong class="pt-3">${title}</strong>
                            <p class="pt-3">${author}</p>
                            <a href="/delete/${id}" class="btn btn-danger btn-sm ms-3 me-0">Remove From BookList</a>
                        </div>
                    </div>
                `;
        })
    })
}
createList(Id);