hexo.extend.helper.register('get_categories', (category) => {
    let posts = hexo.locals.get('posts')
    return posts.filter(item => {
        return item.categories.data.map(item => item.name).includes(category)
    })
})