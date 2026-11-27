// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Tusklet.Server.Auth;
using Tusklet.Server.Handlers.Tasks;
using Tusklet.Server.Models.Requests;
using Tusklet.Server.Services;

namespace Tusklet.Server.Controllers
{
    [ApiController]
    [Authorize]
    [AutoValidateAntiforgeryToken]
    [Route("api/tasks")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class TasksController(IMediator mediator, ILogger<TasksController> logger) : ControllerBase
    {
        [HttpGet("lists")]
        public async Task<IActionResult> GetListsAsync(CancellationToken ct)
        {
            return Session.GetUserId(User) is Guid ownerId
                ? Ok(await mediator.Send(new ReadTaskLists(ownerId), ct))
                : Unauthorized();
        }

        [HttpGet("lists/{listId:guid}")]
        public async Task<IActionResult> GetTasksAsync(Guid listId, CancellationToken ct)
        {
            return Session.GetUserId(User) is Guid ownerId
                ? Ok(await mediator.Send(new ReadTaskItems(ownerId, listId), ct))
                : Unauthorized();
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync(CreateTaskInput input, CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid ownerId)
            {
                return Unauthorized();
            }
            Guid? listId = await mediator.Send(new CreateTask(ownerId, input), ct);
            return listId.HasValue ? StatusCode(StatusCodes.Status201Created, new { ListId = listId.Value }) : NotFound();
        }

        [HttpPut("{taskId:guid}/completion")]
        public async Task<IActionResult> SetCompletionAsync(Guid taskId, TaskCompletionInput input, CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid ownerId)
            {
                return Unauthorized();
            }
            return await mediator.Send(new SetTaskCompletion(ownerId, taskId, input.IsCompleted), ct) ? NoContent() : NotFound();
        }

        [HttpPatch("{taskId:guid}")]
        public async Task<IActionResult> UpdateAsync(Guid taskId, UpdateTaskInput input, CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid ownerId)
            {
                return Unauthorized();
            }
            return await mediator.Send(new UpdateTask(ownerId, taskId, input), ct) ? NoContent() : NotFound();
        }

        [HttpPost("import")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MicrosoftTodoArchive.MaxUploadBytes + 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MicrosoftTodoArchive.MaxUploadBytes)]
        public async Task<IActionResult> ImportAsync(IFormFile file, [FromQuery] bool preview, CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid ownerId)
            {
                return Unauthorized();
            }
            if (file.Length is 0 or > MicrosoftTodoArchive.MaxUploadBytes)
            {
                return BadRequest();
            }

            try
            {
                await using Stream archive = file.OpenReadStream();
                return Ok(await mediator.Send(new ImportMicrosoftTodo(ownerId, archive, preview), ct));
            }
            catch (Exception exception) when (exception is InvalidDataException or EndOfStreamException or JsonException)
            {
                logger.LogInformation("Rejected a Microsoft To Do backup ({ErrorType})", exception.GetType().Name);
                return BadRequest();
            }
        }
    }
}
