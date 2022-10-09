<h1 align="center">hexo-theme-text</h1>
<p align="center">
    一款简约、轻量的主题，以阅读为主，化繁为简。
</p>
<p align="center">
  <img width="39%" style="margin:0 5%" src="https://img.lkxin.cn/tu/2022/10/09/634254332250f.png" alt="1665291313308.png" border="0" />
  <img width="39%"  style="margin:0 5%" src="https://img.lkxin.cn/tu/2022/10/09/634253d6006be.png" alt="634253d6006be.png" border="0" />
</p>

## 功能特性
- [x] 代码高亮
- [x] 内置多语言
- [x] 深色模式
- [x] 文章目录
- [x] 阅读体验优化
- [x] 支持PWA
- [x] 支持无刷新
- [ ] 支持移动端
- [ ] 站内搜索
- [ ] 多款评论插件

## 自定义主题色
可修改 ``/source/css/var.less`` 变量来自定义主题色。
```css
// 默认配置颜色

--transitionTime         : .35s ease; // 过渡时间
--color-font             : #000000; // 主要字体色
--color-meta             : #5c5c5c; // 次要信息颜色
--color-body-bg          : #f2f3f0; // 主题背景色
--color-head-bg          : #ffffff; // 头部背景色
--color-mark-head-bg     : #eeeeee; // 动画切换遮罩色
--color-mark-head-bg     : #252525; // 动画切换遮罩色
--color-comment          : #525f7f; // 评论组建主题色
--color-dashed           : #c5c5c5; // 分割边框色
--color-link             : #bb996d; // 文章中超链接
--color-ng-bar-bg-tint   : #bb996d; // 加载进度条色
--color-link-item-bg     : #f9f9f9; // 友链背景色
--color-link-item-bg-tint: #ffffff; // 友链hover背景色
--color-ng-bar-bg        : #ca8b58; // 加载进度条颜色

```
可使用 命令快速生成颜色
``` 
hexo color <name> <color>
// 示例
hexo color font 38acfa
```
## 相关链接

- [主题预览](https://www.imalun.com)