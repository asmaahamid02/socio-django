$.ajaxSetup({
  beforeSend: function beforeSend(xhr, settings) {
    function getCookie(name) {
      let cookieValue = null

      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')

        for (let i = 0; i < cookies.length; i += 1) {
          const cookie = jQuery.trim(cookies[i])

          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === `${name}=`) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
            break
          }
        }
      }

      return cookieValue
    }

    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
      // Only send the token to relative URLs i.e. locally.
      xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'))
    }
  },
})

$(document).ready(function () {
  const currentUser = $('#current-user').data('user')

  //manage current path
  const pathname = window.location.pathname
  const pathArray = pathname.split('/').filter((path) => path !== '')
  const lastPath = pathArray[pathArray.length - 1]
  const isHomePath = pathArray.length === 0
  const isUserProfilePath = pathArray.length > 0 && lastPath === currentUser

  $(document)
    .on('click', function (e) {
      // close sidebar when click outside
      if (!$(e.target).closest('#main-sidebar').length) {
        $('#main-sidebar').addClass('-translate-x-full')
      }

      //close dropdowns when click outside
      if (!$(e.target).closest('.dropdown-container').length) {
        $('.post-dropdown').addClass('hidden')
      }
    })
    //toggle sidebar
    .on('click', '.sidebar-toggler', function (e) {
      e.stopPropagation()
      e.preventDefault()
      console.log('clicked')
      $('#main-sidebar').toggleClass('-translate-x-full')
    })
    //toggle modal
    .on('click', '.modal-toggler', function (e) {
      e.preventDefault()
      toggle_modal($(this).data('modal-toggle'))
    })
    //close alert message
    .on('click', '.alert-close', function (e) {
      e.preventDefault()
      $(this).parent('.alert').addClass('hidden')
    })
    // toggle dropdown
    .on('click', '.dropdown-toggler', function (e) {
      e.stopPropagation()
      e.preventDefault()

      const dropdownId = $(this).data('dropdown-toggle')
      $(`#${dropdownId}`).toggleClass('hidden').toggleClass('block')
    })
    //upload file
    .on('change', '.file-input', function (e) {
      const file = $(this)[0].files[0]
      const reader = new FileReader()
      const fileInput = $(this)
      const parent = fileInput.parent('.file-input-group')
      const placeholder = parent.find('.file-placeholder')
      const clearInput = parent.find('#clear-image')
      const placeholderIcon = parent.find('.file-icon')

      reader.onload = function (readerEvent) {
        placeholder.attr('src', readerEvent.target.result)

        if (placeholder.hasClass('hidden')) {
          placeholder.removeClass('hidden')
        }

        if (placeholderIcon && !placeholderIcon.hasClass('hidden')) {
          placeholderIcon.addClass('hidden')
        }

        if (clearInput.length > 0) {
          clearInput.prop('checked', false)
        }
      }

      reader.readAsDataURL(file)
    })
    .on('click', '.remove-image', function (e) {
      e.preventDefault()

      console.log('clicked')

      const parent = $(this).parents('.file-input-group')
      const fileInput = parent.find('.file-input')
      const clearInput = parent.find('#clear-image')

      console.log('clearInput', clearInput)
      const placeholder = parent.find('.file-placeholder')
      const staticImage = placeholder.data('static')
      placeholder.attr('src', staticImage)

      fileInput.val('')
      clearInput.prop('checked', true)
    })

    //requests

    //submit post form
    .on('submit', '#post-form', function (e) {
      e.preventDefault()

      const data = new FormData($(this)[0])

      //check if form has data
      if (data.get('body') === '' && data.get('image').size === 0) {
        toggle_message('open', 'Please enter a post body or upload an image.')
        return
      }

      $.ajax({
        type: 'POST',
        url: $(this).data('url'),
        data,
        processData: false,
        contentType: false,
        success: (htmlData) => {
          toggle_message('close') //error message
          toggle_message('open', '', 'success')

          setTimeout(() => {
            //increment post count
            if (isUserProfilePath) {
              const oldCount = $('.posts-count').text()
              const newCount = parseInt(oldCount) + 1
              $('.posts-count').text(newCount)
            }

            toggle_message('close', '', 'success')

            $('#post-body').val('')
            $('#post-image').val('')
            $('#post-image-preview').attr(
              'src',
              $('#post-image-preview').data('default')
            )

            toggle_modal()

            if (isHomePath) {
              toggle_empty_container()
            }

            $('.posts-container').prepend(htmlData)

            //if not home page or current user profile, redirect to home page
            if (!isHomePath && !isUserProfilePath) {
              window.location.href = '/'
            }
          }, 1000)
        },
        error: (error) => {
          console.error('Post Form Error:', error)
          toggle_message('open', error.responseJSON.errors[0])
        },
      })
    })
    //follow/unfollow user
    .on('click', '.follow-btn', function (e) {
      e.preventDefault()

      action = $(this).attr('data-action')

      $(this).prop('disabled', true)

      $.ajax({
        type: 'POST',
        url: $(this).data('url'),
        data: {
          action,
        },
        success: (data) => {
          const wording = action === 'follow' ? 'Unfollow' : 'Follow'
          $(this).text(wording)
          $(this).attr('data-action', wording.toLowerCase())
          $(this).prop('disabled', false)

          const modal = $('#followers-modal')

          //user that is being followed/unfollowed
          const username = $(this).data('username')

          if (isUserProfilePath) {
            const followingsCount = $('.followings-count').text()
            const modalType = modal.attr('data-type')

            if (action === 'unfollow') {
              //decrement followings count
              $('.followings-count').text(parseInt(followingsCount) - 1)

              const userItem = $(`#user-item-${username}`)
              //remove user from followings list
              if (userItem.length > 0 && modalType === 'followings') {
                userItem.remove()
              }
            } else {
              //increment followings count
              $('.followings-count').text(parseInt(followingsCount) + 1)

              const usersContainer = $('.followings-container')

              //add user to followings list
              if (modalType === 'followings') {
                usersContainer.prepend(data)
              }
            }
          } else {
            //if on user profile page and user is being followed/unfollowed
            if (lastPath === username) {
              //update followers count
              const followersCount = $('.followers-count').text()

              if (action === 'unfollow') {
                $('.followers-count').text(parseInt(followersCount) - 1)
              } else {
                $('.followers-count').text(parseInt(followersCount) + 1)
              }
            }
          }

          if (isHomePath) {
            //update follow button on all post cards with the same author
            const userPostCards = $(`.post-author-${username}`)

            if (userPostCards.length > 1) {
              userPostCards.each(function () {
                const followBtn = $(this).find('.follow-btn')
                followBtn.text(wording)
                followBtn.attr('data-action', wording.toLowerCase())
              })
            }
          }
        },
        error: (error) => {
          console.warn(error)
          $(this).prop('disabled', false)
        },
      })
    })
    //fill followers/following list
    .on('click', '.get-followers-btn', function (e) {
      e.preventDefault()

      $.ajax({
        type: 'GET',
        url: $(this).data('url'),
        datatype: 'json',
        contentType: false,
        processData: false,
        success: (data) => {
          const modalId = $(this).data('modal-target')
          const modalTitle = $(this).data('title')

          $(`#${modalId} .modal-title`).text(modalTitle)

          $(`#${modalId}`).attr('data-type', modalTitle.toLowerCase())

          $('.followers-container').html(data)
        },
        error: (error) => {
          console.warn(error)
        },
      })
    })
    .on('click', '.delete-post-btn', function (e) {
      e.preventDefault()
      const url = $(this).attr('data-url')
      const postId = $(this).attr('data-post-id')

      $.ajax({
        type: 'post',
        url,
        success: (data) => {
          // post.remove()

          toggle_modal($(this).attr('data-modal-toggle'))

          const post = $(`#post-${postId}`)
          if (post.length > 0) {
            post.remove()
          }

          //just the empty div remains
          if ($('.posts-container').children().length === 1) {
            toggle_empty_container(false)
          }
        },
        error: (error) => {
          console.warn(`Error deleting post ${postId}`, error)
        },
      })
    })
})

function toggle_message(action = 'open', message = '', type = 'error') {
  const $selector =
    type === 'error' ? $('.post-error-message') : $('.post-success-message')

  if (type === 'error') {
    $selector.children('.alert-message').text(message)
  }

  if (action === 'open') {
    $selector.removeClass('hidden')
  } else {
    $selector.addClass('hidden')
  }
}

function toggle_modal(selector = 'new-post-modal') {
  $(`#${selector}`).toggleClass('hidden flex')
}

function toggle_empty_container(hide = true) {
  if (hide) {
    $('.posts-empty-container').addClass('hidden')
  } else {
    $('.posts-empty-container').removeClass('hidden')
  }
}
